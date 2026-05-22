// TODO: File possibly unused, delete if unused
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { Send, Circle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { FULL_URL } from './../services/api.ts';

type Message = {
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
};

// Conexión fuera del componente para evitar duplicados
const socketUrl = import.meta.env.VITE_WS_URL ?? FULL_URL;
const socket = io(socketUrl);

export function ChatRealTime({ currentUser }: { currentUser: { id: string } | null }) {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Manejo de Conexión y Eventos
  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Unirse a la sala específica de este chat
    socket.emit('join_chat', chatId);

    // Escuchar mensajes nuevos
    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Cargar historial previo (Persistencia)
    fetch(`${FULL_URL}/api/messages/${chatId}`)
      .then(res => res.json())
      .then(data => setMessages(data));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receive_message');
    };
  }, [chatId]);

  // 2. Auto-Scroll: Siempre bajar al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !currentUser?.id) return;

    const messageData = {
      chatId,
      senderId: currentUser.id,
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    // Emitir por socket (Tiempo real)
    socket.emit('send_message', messageData);
    
    // Guardar en DB (Persistencia) a través del backend
    fetch(`${FULL_URL}/api/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'user-id': currentUser.id 
      },
      body: JSON.stringify(messageData)
    });

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-white shadow-lg">
      {/* Indicador de Estado */}
      <div className="p-3 border-b flex items-center justify-between bg-muted/50">
        <span className="font-bold">Chat de Entrega</span>
        <div className="flex items-center gap-2">
          <Circle className={`w-3 h-3 fill-current ${isConnected ? 'text-green-500' : 'text-red-500 animate-pulse'}`} />
          <span className="text-xs">{isConnected ? 'Conectado' : 'Reconectando...'}</span>
        </div>
      </div>

      {/* Cuerpo del Chat (Scroll Area) */}
      <ScrollArea className="flex-1 p-4 bg-gray-50">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                msg.senderId === currentUser?.id 
                ? 'bg-[#003366] text-white rounded-br-none' // Azul institucional
                : 'bg-gray-200 text-gray-800 rounded-bl-none' // Gris claro
              }`}>
                <p className="text-sm">{msg.text}</p>
                <span className="text-[10px] opacity-70 block text-right mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={scrollRef} /> 
        </div>
      </ScrollArea>

      {/* Input de Mensaje */}
      <div className="p-4 border-t flex gap-2 bg-white">
        <Input 
          placeholder="Escribe un mensaje para coordinar..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button onClick={handleSend} className="bg-[#003366] hover:bg-[#002244]">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
