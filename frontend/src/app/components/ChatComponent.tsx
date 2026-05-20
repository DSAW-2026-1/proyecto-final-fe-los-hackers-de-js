// TODO: File possibly unused, delete if unused
import React, { useState } from 'react';
import { Send, Search, MoreVertical, Phone, MessageSquare } from 'lucide-react';



const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${props.className}`} />
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'icon';
}
const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'hover:bg-slate-100 text-slate-500',
  } as const;
  const sizes = {
    md: 'h-10 px-4 py-2',
    icon: 'h-10 w-10 flex items-center justify-center',
  } as const;
  return (
    <button {...props} className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

// --- COMPONENTE PRINCIPAL DEL CHAT ---
export function ChatComponent() {
  const [activeChat, setActiveChat] = useState(1);
  const [newMessage, setNewMessage] = useState('');

  const chats = [
    { id: 1, name: 'Andrés Felipe', lastMsg: '¿Sigue disponible el libro?', time: '12:45 PM', online: true, initials: 'AF' },
    { id: 2, name: 'María Paula', lastMsg: 'Te veo en la Biblioteca a las 2', time: 'Ayer', online: false, initials: 'MP' },
    { id: 3, name: 'Juan Sebastián', lastMsg: '¿Cuál es el precio mínimo?', time: 'Lunes', online: true, initials: 'JS' }
  ];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    console.log("Mensaje enviado:", newMessage);
    setNewMessage('');
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto flex h-[750px] border rounded-2xl overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200">
        
        {/* SIDEBAR: LISTA DE CHATS */}
        <div className="w-1/3 border-r bg-white flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="text-blue-600" size={24} />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Chats</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <Input 
                className="pl-10 bg-slate-100 border-none rounded-xl" 
                placeholder="Buscar en Sabana Market..." 
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => setActiveChat(chat.id)}
                className={`p-4 border-b cursor-pointer transition-all hover:bg-slate-50 ${
                  activeChat === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-inner">
                      {chat.initials}
                    </div>
                    {chat.online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{chat.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">{chat.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate font-medium">{chat.lastMsg}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ÁREA PRINCIPAL: CONVERSACIÓN */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
                {chats.find(c => c.id === activeChat)?.initials}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 leading-none mb-1">
                  {chats.find(c => c.id === activeChat)?.name}
                </h3>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Activo ahora</p>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon"><Phone size={18} /></Button>
              <Button variant="ghost" size="icon"><MoreVertical size={18} /></Button>
            </div>
          </div>

          {/* Burbujas de Mensajes */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/30">
            <div className="flex justify-start">
              <div className="max-w-[75%]">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    ¡Hola! ¿Aún tienes el artículo disponible? Me interesa verlo mañana en el campus.
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 inline-block font-medium">12:45 PM</span>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="max-w-[75%]">
                <div className="bg-blue-600 p-4 rounded-2xl rounded-tr-none shadow-xl shadow-blue-100">
                  <p className="text-sm text-white leading-relaxed font-medium">
                    ¡Hola! Sí, claro. Estaré en la Biblioteca Octavio Arizmendi a las 10:00 AM. ¿Te sirve?
                  </p>
                </div>
                <div className="flex justify-end items-center gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">12:46 PM • Leído</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer: Input de envío */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-3 items-center max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <Input 
                  placeholder="Escribe un mensaje aquí..." 
                  className="bg-slate-100 border-none h-12 pr-12 rounded-xl focus:ring-2 focus:ring-blue-600/20"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
              </div>
              <Button 
                onClick={handleSendMessage}
                className="h-12 w-12 rounded-xl shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
              >
                <Send size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}