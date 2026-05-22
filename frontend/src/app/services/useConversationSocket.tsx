import { useEffect, useState, useRef } from 'react';
import { initSocket, sendMessage as sendMessageViaSocket, getSocket } from './socketService';
import { apiRequest } from './api';
/* eslint-disable @typescript-eslint/no-explicit-any */

type Msg = {
  id?: number;
  tempId?: string;
  message: string;
  sender?: string;
  time?: string;
  isOwn?: boolean;
  status?: 'sending' | 'sent';
};

export default function useConversationSocket(chatId: any) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const jwt = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
  const pollTimerRef = useRef<number | null>(null);
  const lastCheckedRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const socket = initSocket(jwt);

    // Broadcast that this conversation is active (for other modules / tabs)
    try {
      if (typeof window !== 'undefined') {
        try {
          const stateBc = new BroadcastChannel('app-state');
          stateBc.postMessage({ type: 'active_conversation', value: chatId });
          // also store in localStorage as fallback
          localStorage.setItem('app-active-conversation', JSON.stringify(chatId));
          // when unmounting, clear active flag
          const cleanup = () => {
            try { stateBc.postMessage({ type: 'active_conversation', value: null }); } catch { /* ignore */ }
            try { localStorage.setItem('app-active-conversation', JSON.stringify(null)); } catch { /* ignore */ }
            try { stateBc.close(); } catch { /* ignore */ }
          };
          // attach cleanup on unmount via effect return below
          (window as any).__useConversationSocketCleanup = cleanup;
        } catch { /* ignore BC errors */ }
      }
    } catch { /* ignore */ }

    const handleReceive = (payload: unknown) => {
      // payload may contain chatId or conversationId, and may use content/senderId/createdAt
      if (!chatId) return;
      const p = payload as any;
      const payloadConvId = p?.chatId ?? p?.conversationId ?? chatId;
      if (String(payloadConvId) !== String(chatId)) return;

      // normalize incoming message shape
      const incoming = {
        id: p.id ?? p._id ?? p.messageId,
        tempId: p.tempId,
        message: p.content ?? p.message ?? p.text ?? '',
        sender: p.senderId ?? p.sender ?? p.from ?? null,
        time: p.createdAt ?? p.time ?? p.timestamp ?? null,
        chatId: payloadConvId,
      } as any;

      // update lastChecked to newest timestamp
      try {
        if (incoming.time) lastCheckedRef.current = new Date(String(incoming.time)).toISOString();
      } catch { /* ignore */ }

      setMessages((prev) => {
        if (incoming.tempId) {
          const idx = prev.findIndex((m) => m.tempId === incoming.tempId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...incoming, status: 'sent' };
            return updated;
          }
        }
        return [...prev, { ...incoming, status: 'sent' }];
      });
    };

    const startPolling = () => {
      if (pollTimerRef.current != null) return; // already polling
      console.info(`[chat:${chatId}] WebSocket unavailable — starting polling fallback`);
      // initialize lastChecked to now so we only get new messages
      lastCheckedRef.current = new Date().toISOString();
      const intervalId = window.setInterval(async () => {
        try {
          if (!mounted) return;
          const since = lastCheckedRef.current || new Date().toISOString();
          const res = await apiRequest(`/api/chat/${chatId}/messages/polling?lastCheckedAt=${encodeURIComponent(since)}`);
          if (res && Array.isArray(res.messages) && res.messages.length > 0) {
            // normalize and feed into handler
            for (const m of res.messages) {
              try { m.chatId = m.chatId ?? chatId; } catch { /* ignore */ }
              handleReceive(m);
            }
            const last = res.messages[res.messages.length - 1];
            try { lastCheckedRef.current = new Date(String(last.createdAt ?? last.time ?? Date.now())).toISOString(); } catch { lastCheckedRef.current = new Date().toISOString(); }
            console.info(`[chat:${chatId}] Polling: received ${res.messages.length} new messages`);
          }
        } catch (e) {
          console.warn(`[chat:${chatId}] polling error`, e);
        }
      }, 5000);
      pollTimerRef.current = intervalId as unknown as number;
    };

    const stopPolling = () => {
      if (pollTimerRef.current == null) return;
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
      console.info(`[chat:${chatId}] Stopped polling fallback (WebSocket restored)`);
    };

    // If socket not available or not connected, start polling
    if (!socket || !(socket as any).connected) {
      startPolling();
    }

    if (socket) {
       const handleConnect = () => {
         stopPolling();
       };
       const handleDisconnect = () => {
         startPolling();
       };
       const handleConnectError = () => {
         startPolling();
       };

       socket.on('receive_message', handleReceive);
       socket.on('connect', handleConnect);
       socket.on('disconnect', handleDisconnect);
       socket.on('connect_error', handleConnectError);

      // ensure cleanup removes listeners
      return () => {
        mounted = false;
        try {
           socket.off('receive_message', handleReceive);
           socket.off('connect', handleConnect);
           socket.off('disconnect', handleDisconnect);
           socket.off('connect_error', handleConnectError);
        } catch { /* ignore */ }
        stopPolling();
        // cleanup active conversation broadcast
        try {
          const c = (window as any).__useConversationSocketCleanup;
          if (typeof c === 'function') c();
          delete (window as any).__useConversationSocketCleanup;
        } catch { /* ignore */ }
      };
    }

    // if there is no socket at all, still return cleanup to stop polling
    return () => {
      mounted = false;
      try { stopPolling(); } catch { /* ignore */ }
      try {
        const c = (window as any).__useConversationSocketCleanup;
        if (typeof c === 'function') c();
        delete (window as any).__useConversationSocketCleanup;
      } catch { /* ignore */ }
    };
  }, [chatId, jwt]);

  async function send(message: string) {
    const tempId = 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    const optimistic: Msg = { tempId, message, isOwn: true, status: 'sending' };
    setMessages((prev) => [...prev, optimistic]);
    const socket = getSocket();
    if (socket && (socket as any).connected) {
      sendMessageViaSocket(chatId, message, tempId);
      return;
    }

    try {
      const res = await apiRequest(`/api/chat/${chatId}/messages/polling`, {
        method: 'POST',
        body: JSON.stringify({ content: message, tempId }),
      });
      const payload = (res as any)?.message ?? res;
      const incoming = {
        id: payload?.id ?? payload?._id ?? payload?.messageId,
        tempId,
        message: payload?.content ?? payload?.message ?? payload?.text ?? message,
        sender: payload?.senderId ?? payload?.sender ?? payload?.from ?? null,
        time: payload?.createdAt ?? payload?.time ?? payload?.timestamp ?? null,
      } as any;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.tempId === tempId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...incoming, status: 'sent' };
          return updated;
        }
        return [...prev, { ...incoming, status: 'sent' }];
      });
    } catch (e) {
      console.warn('Polling send failed', e);
    }
  }

  return { messages, send, setMessages };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
