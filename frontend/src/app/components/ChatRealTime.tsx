/** @jsxImportSource react */
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { Send, Circle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost';
const PORT = import.meta.env.VITE_API_PORT || null;

const BACKEND_URL = (PORT)? `${BASE_URL}:${PORT}` : `${BASE_URL}`;
const socket: Socket = io(BACKEND_URL);

interface Message {
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export function ChatRealTime({ currentUser }: { currentUser: { id: string } | null }) {
  const { chatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onMessage = (data: Message) => setMessages((prev) => [...prev, data]);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onMessage);

    if (chatId) {
      socket.emit('join_chat', chatId);
      fetch(`${BACKEND_URL}/api/messages/${chatId}`)
        .then(res => res.json())
        .then((data: Message[]) => setMessages(Array.isArray(data) ? data : []))
        .catch(err => console.error("Error cargando historial:", err));
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onMessage);
    };
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser || !chatId) return;

    const msgData: Message = { 
      chatId, 
      senderId: currentUser.id, 
      text: newMessage, 
      timestamp: new Date().toISOString() 
    };

    socket.emit('send_message', msgData);
    
    try {
      await fetch(`${BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': currentUser.id },
        body: JSON.stringify(msgData)
      });
    } catch (error) {
      console.error("Error al guardar:", error);
    }

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-white overflow-hidden shadow-sm">
      <div className="p-3 border-b flex items-center justify-between bg-[#003366] text-white">
        <span className="font-bold">Chat de Entrega Unisabana</span>
        <div className="flex items-center gap-2">
          <Circle className={`w-2 h-2 fill-current ${isConnected ? 'text-green-400' : 'text-red-400 animate-pulse'}`} />
          <span className="text-[10px] font-bold uppercase">{isConnected ? 'Conectado' : 'Desconectado'}</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 bg-gray-50">
        <div className="space-y-4">
          {messages.map((msg, index) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  isMe ? 'bg-[#003366] text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Escribe un mensaje..." 
        />
        <Button onClick={handleSend} className="bg-[#003366]">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

