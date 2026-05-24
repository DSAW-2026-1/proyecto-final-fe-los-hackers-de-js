/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// BroadcastChannel & localStorage keys for cross-tab communication
const CHANNEL_NAME = 'app-messages';
const STATE_CHANNEL = 'app-state';
let bc: BroadcastChannel | null = null;
let stateBc: BroadcastChannel | null = null;
let activeConversation: string | number | null = null;
let isHidden = typeof document !== 'undefined' ? document.hidden : false;

function safePost(obj: unknown) {
  try {
    bc?.postMessage(obj as unknown);
  } catch { /* ignore */ }
  try {
    // storage fallback to trigger storage events across tabs
    localStorage.setItem('app-last-message', JSON.stringify(obj as unknown));
  } catch { /* ignore */ }
}

function playBeep() {
  // Sound playback disabled: message reception should not produce audio.
  // Kept for backwards compatibility if sound is re-enabled later.
  return;
}

export function initSocket(jwt: string, url = (import.meta.env.VITE_WS_URL ?? 'http://localhost:3000')): Socket | null {
  if (socket) {
    const currentToken = socket.auth && typeof socket.auth === 'object' ? (socket.auth as any).token : undefined;
    if (currentToken !== jwt) {
      console.info('Switching socket authentication: token changed');
      try {
        socket.disconnect();
      } catch { /* ignore */ }
      socket = null;
    } else {
      return socket;
    }
  }
  try {
    socket = io(url as string, {
      auth: { token: jwt },
      transports: ['websocket'],
    });

    // setup channels once
    if (typeof window !== 'undefined') {
      try { bc = new BroadcastChannel(CHANNEL_NAME); } catch { bc = null; }
      try { stateBc = new BroadcastChannel(STATE_CHANNEL); } catch { stateBc = null; }

      // track active conversation posted by conversation views
      const onStateMsg = (ev: MessageEvent) => {
        const data = ev?.data;
        if (data?.type === 'active_conversation') {
          activeConversation = data.value;
        }
        if (data?.type === 'visibility') {
          isHidden = !!data.value;
        }
      };
      stateBc?.addEventListener('message', onStateMsg);

      // storage fallback for tabs without BroadcastChannel support
      const onStorage = (e: StorageEvent) => {
        if (e.key === 'app-active-conversation') {
          try { activeConversation = JSON.parse(e.newValue || 'null'); } catch { activeConversation = null; }
        }
        if (e.key === 'app-visibility') {
          try { isHidden = JSON.parse(e.newValue || 'false'); } catch { /* ignore */ }
        }
      };
      window.addEventListener('storage', onStorage);

      // keep local visibility flag updated for current tab
      document.addEventListener('visibilitychange', () => {
        isHidden = document.hidden;
        try { stateBc?.postMessage({ type: 'visibility', value: isHidden }); } catch { /* ignore */ }
        try { localStorage.setItem('app-visibility', JSON.stringify(isHidden)); } catch { /* ignore */ }
      });
    }

    socket.on('connect_error', (err) => console.error('Socket connect_error', err));

    // Global receive handler: broadcast to app, play sound, emit read when appropriate
    socket.on('receive_message', (payload: unknown) => {
      try {
        // Notify other parts of the app (and other tabs)
        safePost({ type: 'receive_message', payload });

        const convId = (payload as Record<string, unknown>)['chatId'] ?? (payload as Record<string, unknown>)['conversationId'];
        // If user is currently viewing the conversation and tab visible -> mark read
        if (convId != null && activeConversation != null && String(convId) === String(activeConversation) && !isHidden) {
          socket?.emit('message_read', { chatId: convId });
        } else {
          // send conversation preview/update for UI lists
          safePost({ type: 'conversation_update', payload });
        }

        // Play subtle sound only when tab is hidden
        if (isHidden) {
          playBeep();
        }
      } catch (error) {
        console.error('Error handling receive_message', error);
      }
    });

  } catch (e) {
    console.error('initSocket error', e);
    socket = null;
  }
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    try {
      socket.disconnect();
    } catch (e) {
      console.error('Error disconnecting socket', e);
    }
    socket = null;
  }
}

export function on(event: string, cb: (...args: unknown[]) => void) {
  socket?.on(event, cb);
}

export function off(event: string, cb?: (...args: unknown[]) => void) {
  if (!socket) return;
  if (cb) socket.off(event, cb);
  else socket.off(event);
}

export function sendMessage(conversationId: number | string, content: string, tempId: string) {
  socket?.emit('send_message', { chatId: conversationId, content, tempId });
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  on,
  off,
  sendMessage,
};
