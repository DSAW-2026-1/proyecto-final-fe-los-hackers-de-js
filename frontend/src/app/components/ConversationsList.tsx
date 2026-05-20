/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Avatar } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { apiRequest } from '../services/api';
import { useNavigate, useLocation } from 'react-router';
import { useNotifications } from '../context/NotificationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Trash } from 'lucide-react';
import Base64ImageLoader from './Base64ImageLoader';

interface Conv {
  id: number | string;
  otherUser?: { name?: string; avatar?: string; photo?: string } | null;
  product?: { title?: string; image?: string; price?: string | number } | null;
  lastMessage?: string;
  lastTime?: string | number | null;
  unread?: number;
}

interface ConversationsListProps {
  onSelect?: (conv: Conv) => void;
}

interface APIChatParticipant {
  name?: string;
  photo?: string;
  username?: string;
}

interface APIChatProduct {
  id?: string;
  _id?: string;
  title?: string;
  image?: string;
  price?: number;
}

interface APIChatMessage {
  content?: string;
  message?: string;
  createdAt?: string;
}

interface APIChat {
  id?: string;
  _id?: string;
  conversationId?: string;
  conversation_id?: string;
  otherUser?: APIChatParticipant | null;
  participant?: APIChatParticipant | null;
  user?: APIChatParticipant | null;
  product?: APIChatProduct | null;
  lastMessage?: APIChatMessage | null;
  preview?: string;
  last?: APIChatMessage | null;
  lastMessageText?: string;
  updatedAt?: string;
  unreadCount?: number;
  unread?: number;
}

export default function ConversationsList({ onSelect }: ConversationsListProps) {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [query, setQuery] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { decrementUnreadCount } = useNotifications();

  const getSingleImageString = (imgData: any): string | undefined => {
    if (!imgData) return undefined;
    if (typeof imgData === 'string') return imgData;
    if (Array.isArray(imgData)) {
      for (const item of imgData) {
        const res = getSingleImageString(item);
        if (res) return res;
      }
    }
    if (typeof imgData === 'object') {
      const values = Object.values(imgData);
      for (const val of values) {
        const res = getSingleImageString(val);
        if (res) return res;
      }
    }
    return undefined;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiRequest('/api/chat/my?limit=50&offset=0');
        if (!mounted) return;
        const convArray = Array.isArray(data) ? data : (data?.conversations ?? data?.result ?? []);
        const mapped = (convArray || []).map((c: APIChat) => ({
          id: c.id ?? c._id ?? c.conversationId ?? c.conversation_id ?? '',
          otherUser: c.otherUser ?? c.participant ?? c.user ?? null,
          product: c.product ?? null,
          lastMessage: (c.lastMessage && (c.lastMessage.content || c.lastMessage.message)) || c.preview || c.last?.content || c.last?.message || c.lastMessageText || '',
          lastTime: c.updatedAt ?? c.lastMessage?.createdAt ?? c.last?.createdAt ?? null,
          unread: Number(c.unreadCount ?? c.unread ?? 0),
        }));
        setConvs(mapped || []);
      } catch (e) {
        console.error('ConversationsList: failed to fetch', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Listen for socket broadcasts to update conversation previews and removals
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let bc: BroadcastChannel | null = null;
    try { bc = ('BroadcastChannel' in window) ? new BroadcastChannel('app-messages') : null; } catch { bc = null; }

    const handler = (ev: MessageEvent) => {
      const d = ev?.data || {};
      if (d?.type === 'conversation_update' || d?.type === 'receive_message') {
        const payload = d.payload || d.data || d;
        const convId = payload?.conversationId ?? payload?.conversation_id ?? payload?.conversationId;
        if (!convId) return;
        setConvs((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((x) => String(x.id) === String(convId));
          const preview = payload?.message ?? payload?.content ?? payload?.text ?? payload?.preview ?? payload?.lastMessage ?? '';
          const time = payload?.time ?? payload?.createdAt ?? payload?.timestamp ?? payload?.sentAt ?? Date.now();
          if (idx !== -1) {
            const item = { ...updated[idx] };
            item.lastMessage = preview;
            item.lastTime = time;
            item.unread = (Number(item.unread || 0) + 1);
            // move to top
            updated.splice(idx, 1);
            return [item, ...updated];
          }
          // if new conversation, prepend
          const newConv: Conv = {
            id: convId,
            otherUser: payload?.otherUser ?? null,
            product: payload?.product ?? null,
            lastMessage: preview,
            lastTime: time,
            unread: 1,
          };
          return [newConv, ...updated];
        });
      }

      if (d?.type === 'conversation_removed' || d?.type === 'conversation_deleted') {
        const payload = d.payload || d.data || d;
        const convId = payload?.conversationId ?? payload?.conversation_id ?? payload?.id;
        if (!convId) return;
        setConvs((prev) => prev.filter((c) => String(c.id) !== String(convId)));
      }
    };

    bc?.addEventListener('message', handler);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'app-last-message' && e.newValue) {
        try {
          const obj = JSON.parse(e.newValue);
          const payload = obj?.payload || obj?.data || obj;
          const evObj = { data: payload, type: 'receive_message' } as unknown as MessageEvent;
          handler(evObj);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      try { bc?.removeEventListener('message', handler); } catch { /* ignore */ }
      try { bc?.close(); } catch { /* ignore */ }
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return convs;
    return convs.filter((c) => {
      const name = (c.otherUser?.name || '').toLowerCase();
      const product = (c.product?.title || '').toLowerCase();
      const msg = (c.lastMessage || '').toLowerCase();
      return name.includes(q) || product.includes(q) || msg.includes(q);
    });
  }, [convs, query]);

  function formatTime(ts?: unknown) {
    if (!ts) return '';
    try { return new Date(String(ts)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return String(ts); }
  }

  const openConv = (idOrConv: number | string | Conv, unread?: number) => {
    // allow passing either id or full conversation object
    const conv = (typeof idOrConv === 'object') ? idOrConv : null;
    const id = conv ? (conv.id ?? conv.conversationId) : idOrConv;
    if (unread && unread > 0) decrementUnreadCount(unread);

    if (onSelect) {
      try { onSelect(conv || { id, otherUser: null, product: null, lastMessage: '' }); } catch { /* ignore */ }
      return;
    }

    navigate(`/chat?open=${id}`);
  };

  const askDelete = (id: number | string) => {
    setTargetId(id);
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!targetId) return;
    setIsDeleting(true);
    const prev = convs;
    setConvs(prev.filter((c) => String(c.id) !== String(targetId)));

    // broadcast optimistic removal so other components update
    try {
      const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('app-messages') : null;
      bc?.postMessage({ type: 'conversation_removed', payload: { conversationId: targetId } });
      bc?.close();

      await apiRequest(`/api/chat/${targetId}`, { method: 'DELETE' });

      // if currently viewing this conversation (old messages route) or chat open, redirect to chat root
      if (location.pathname.includes(`/messages/${targetId}`) || location.pathname.includes(`/messages/${String(targetId)}`) || (location.search || '').includes(`open=${targetId}`)) {
        navigate('/chat');
        toast.success('Conversation removed');
      } else {
        toast.success('Conversation removed');
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setConvs(prev);
      toast.error(e?.message || 'Could not remove conversation');
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
      setTargetId(null);
    }
  };

  return (
    <Card className="lg:col-span-1 p-4 flex flex-col h-[400px] lg:h-full overflow-hidden">
      <div className="mb-4">
        <Input placeholder="Buscar conversaciones..." value={query} onChange={(e) => setQuery((e.target as HTMLInputElement).value)} />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2">
          {filtered.map((conv) => {
            const singlePhoto = getSingleImageString(conv.otherUser?.photo || conv.otherUser?.avatar);
            return (
              <div
                key={String(conv.id)}
                onClick={() => openConv(conv, conv.unread)}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  (conv.unread || 0) > 0 ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); askDelete(conv.id); }}
                  aria-label="Eliminar conversación"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash className="size-4" />
                </button>

                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      {singlePhoto ? (
                        <Base64ImageLoader
                          data={singlePhoto}
                          alt={conv.otherUser?.name || 'Avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center font-medium text-primary">
                          {(conv.otherUser?.name || 'US').split(' ').map((n:string)=>n[0]).slice(0,2).join('')}
                        </div>
                      )}
                    </Avatar>
                    {(conv.unread || 0) > 0 ? (
                      <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0 pr-0 group-hover:pr-8 transition-all duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium truncate">{conv.otherUser?.name || 'Usuario'}</h4>
                      <span className="text-xs text-muted-foreground">{formatTime(conv.lastTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">{conv.product?.title || conv.lastMessage}</p>
                      {(conv.unread || 0) > 0 ? (
                        <Badge className="ml-2 bg-accent">{conv.unread}</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={(openMod) => { if (!openMod) { setConfirmOpen(false); setTargetId(null); } }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Eliminar conversación</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">¿Estás seguro que quieres eliminar este chat? Esta acción solo eliminará el chat para ti.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmOpen(false); setTargetId(null); }} disabled={isDeleting}>Cancelar</Button>
            <Button onClick={performDelete} disabled={isDeleting} className="bg-destructive text-white">{isDeleting ? 'Eliminando...' : 'Eliminar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
