import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Send, Paperclip, MoreVertical } from 'lucide-react';

const CONVERSATIONS = [
  { id: 1, name: 'Ana Rodríguez', message: 'Hola, ¿el MacBook aún está...', time: '10:30 AM', unread: 2, online: true },
  { id: 2, name: 'Carlos López', message: '¿Puedes hacerme un descuent...', time: 'Ayer', unread: 0, online: false },
  { id: 3, name: 'María García', message: 'Perfecto, nos vemos mañana', time: 'Ayer', unread: 0, online: true },
];

const MESSAGES = [
  { id: 1, sender: 'Ana Rodríguez', message: 'Hola! Vi tu publicación del MacBook', time: '10:15 AM', isOwn: false },
  { id: 2, sender: 'Tú', message: 'Hola Ana! Sí, aún está disponible', time: '10:16 AM', isOwn: true },
  { id: 3, sender: 'Ana Rodríguez', message: '¿Cuánto tiempo de uso tiene?', time: '10:17 AM', isOwn: false },
  { id: 4, sender: 'Tú', message: 'Aproximadamente 1 año. La batería está en perfecto estado al 92%', time: '10:18 AM', isOwn: true },
  { id: 5, sender: 'Ana Rodríguez', message: '¿Podríamos vernos en el campus para verlo?', time: '10:30 AM', isOwn: false },
];

export function ChatInterface() {
  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">Mensajes</h2>
          <p className="text-muted-foreground">Comunícate directamente con compradores y vendedores</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:h-[600px]">
          <Card className="lg:col-span-1 p-4 flex flex-col h-[400px] lg:h-full overflow-hidden">
            <div className="mb-4">
              <Input placeholder="Buscar conversaciones..." />
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-2">
                {CONVERSATIONS.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      conv.id === 1 ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center font-medium text-primary">
                            {conv.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        </Avatar>
                        {conv.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium truncate">{conv.name}</h4>
                          <span className="text-xs text-muted-foreground">{conv.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">{conv.message}</p>
                          {conv.unread > 0 && (
                            <Badge className="ml-2 bg-accent">{conv.unread}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          <Card className="lg:col-span-2 flex flex-col h-[500px] lg:h-full overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center font-medium text-primary">
                    AR
                  </div>
                </Avatar>
                <div>
                  <h3 className="font-semibold">Ana Rodríguez</h3>
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
                  <div className="w-full h-full bg-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">MacBook Air M1 2020</p>
                  <p className="text-sm text-muted-foreground">$3,200,000 COP</p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 p-4">
              <div className="space-y-4">
                {MESSAGES.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${msg.isOwn ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          msg.isOwn
                            ? 'bg-primary text-white rounded-br-none'
                            : 'bg-white border rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 px-2">
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                />
                <Button size="icon" className="bg-primary">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
