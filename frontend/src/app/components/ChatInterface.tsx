/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';
import { Send, Paperclip, MoreVertical, MessageCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import useConversationSocket from '../services/useConversationSocket';
import ConversationsList from './ConversationsList';
import { useLocation } from 'react-router';
import { apiRequest } from '../services/api';
import Base64ImageLoader from './Base64ImageLoader';

// Messages are managed via socket hook (optimistic updates).

interface ConversationUser {
  name?: string;
  photo?: any;
  avatar?: any;
  username?: string;
}

interface ConversationProduct {
  id?: string;
  image?: any;
  images?: any;
  title?: string;
  name?: string;
  price?: string | number;
}

interface Conversation {
  id: string | number;
  _id?: string | number;
  conversationId?: string | number;
  otherUser?: ConversationUser | null;
  product?: ConversationProduct | null;
}

interface APIMessage {
  _id?: string;
  id?: string;
  content?: string;
  senderId?: string;
  createdAt?: string;
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const { uid } = useAuth();
  const location = useLocation();
  const { messages, send, setMessages } = useConversationSocket(selectedConv?.id ?? selectedConv?._id ?? null);

  // Load history when a conversation is selected
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // If URL contains ?open=<chatId> auto-open that conversation
  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const open = params.get('open');
    let mounted = true;
    (async () => {
      try {
        if (open) {
          // fetch conversation metadata
          const conv = await apiRequest(`/api/chat/${open}`);
          if (mounted && conv) {
            const normalized: Conversation = {
              id: conv.id ?? conv._id ?? conv.conversationId ?? open,
              otherUser: conv.otherUser ?? conv.participant ?? conv.user ?? null,
              product: conv.product ?? null,
            };
            setSelectedConv(normalized);
          }
        }
      } catch (e) {
        console.error('Failed to auto-open conversation from URL', e);
      }
    })();

    return () => { mounted = false; };
  }, [location.search]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedConv) return;
      try {
        const chatId = selectedConv.id ?? selectedConv._id ?? selectedConv.conversationId;
        const data = await apiRequest(`/api/chat/${chatId}/messages?limit=100&offset=0`);
        if (!mounted) return;
        
        // Normalize messages safely
        const rawList = Array.isArray(data) ? data : (data?.messages || []);
        const msgs = rawList.map((m: APIMessage) => ({
          id: m._id ?? m.id,
          message: m.content || '',
          sender: m.senderId,
          time: m.createdAt,
          isOwn: m.senderId === uid
        }));
        setMessages(msgs);
      } catch (e) {
        console.error('Failed to load conversation messages', e);
      }
    })();
    return () => { mounted = false; };
  }, [selectedConv, setMessages, uid]);

  // Utility to format ISO timestamps to HH:MM AM/PM
  const formatMsgTime = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timestamp;
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      send(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

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

  const renderPhoto = (photoData?: any, name?: string) => {
    const singlePhoto = getSingleImageString(photoData);
    if (!singlePhoto) {
      const initials = (name || 'US').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
      return (
        <div className="w-full h-full bg-primary/20 flex items-center justify-center font-medium text-primary">
          {initials}
        </div>
      );
    }

    return (
      <Base64ImageLoader
        data={singlePhoto}
        alt={name || 'Avatar'}
        className="w-full h-full object-cover"
      />
    );
  };

  const renderProductImage = (image?: any, title?: string) => {
    const singleImage = getSingleImageString(image);
    if (!singleImage) {
      return <div className="w-full h-full bg-muted animate-pulse" />;
    }

    return (
      <Base64ImageLoader
        data={singleImage}
        alt={title || 'Product'}
        className="w-full h-full object-cover"
      />
    );
  };

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">Mensajes</h2>
          <p className="text-muted-foreground">Comunícate directamente con compradores y vendedores</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:h-[600px]">
          <ConversationsList onSelect={(conv: Conversation) => setSelectedConv(conv)} />

          {!selectedConv ? (
            <Card className="lg:col-span-2 flex flex-col h-[500px] lg:h-full justify-center items-center p-8 bg-card text-center border-dashed border-2 border-muted/80">
              <div className="max-w-md flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Mensajes</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Selecciona una conversación de la lista de la izquierda para ver tus mensajes, negociar y coordinar la entrega en el campus de La Sabana.
                </p>
              </div>
            </Card>
          ) : (
            <Card className="lg:col-span-2 flex flex-col h-[500px] lg:h-full overflow-hidden gap-0">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    {renderPhoto(selectedConv?.otherUser?.photo, selectedConv?.otherUser?.name)}
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConv?.otherUser?.name || 'Usuario'}</h3>
                    <p className="text-sm text-green-600">En línea</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-4 bg-muted/50 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded overflow-hidden">
                    {renderProductImage(selectedConv?.product?.image ?? selectedConv?.product?.images, selectedConv?.product?.title)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedConv?.product?.title || ''}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedConv?.product?.price ? `$${Number(selectedConv.product.price).toLocaleString('es-CO')} COP` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-4" ref={scrollContainerRef}>
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id ?? msg.tempId}
                      className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${msg.isOwn ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl break-words whitespace-pre-wrap ${
                            msg.isOwn
                              ? 'bg-primary text-white rounded-br-none'
                              : 'bg-white border rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-2">
                          {msg.time ? formatMsgTime(msg.time) : (msg.status === 'sending' ? 'Enviando...' : '')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    placeholder="Escribe un mensaje..."
                    className="flex-1"
                    value={input}
                    onChange={(e) => setInput((e.target as HTMLInputElement).value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button size="icon" className="bg-primary" onClick={handleSend}>
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
