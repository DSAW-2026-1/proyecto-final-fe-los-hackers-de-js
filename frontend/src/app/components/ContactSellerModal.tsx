import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { apiRequest } from '../services/api';

// Definimos qué datos necesita el componente para funcionar
interface ContactSellerModalProps {
  product: { id: string; name: string };
  sellerId: string;
  currentUser: { id: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContactSellerModal({ product, sellerId, currentUser, isOpen, onClose }: ContactSellerModalProps) {
  const [message, setMessage] = useState(`Hola, estoy interesado en tu producto ${product?.name}...`);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStartChat = async () => {
    if (!currentUser) return;

    if (String(currentUser.id) === String(sellerId)) {
      alert('No puedes iniciar una conversación contigo mismo.');
      onClose();
      return;
    }

    setLoading(true); // Feedback: "Iniciando conversación..."

    try {
      // 1. Use unified API to create or return a chat for this product
      const data = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ productID: product.id })
      });

      const convId = data?.id ?? data?.chatId ?? data?.chat_id ?? data?.chat?.id ?? data?.conversationId ?? data?.conversation_id ?? data?.conversation?.id ?? data?._id;
      if (!convId) throw new Error('No se obtuvo el id de la conversación');

      // 2. Send initial message to new chat (best-effort: don't block navigation)
      try {
        await apiRequest(`/api/chat/${convId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content: message })
        });
      } catch (msgErr) {
        console.warn('Conversación creada pero no se pudo enviar el mensaje inicial', msgErr);
      }

      // 3. Redirect to standard chat interface with conversation opened
      navigate(`/chat?open=${convId}`);
      onClose(); // Close modal
    } catch (error) {
      console.error('Hubo un problema:', error);
      alert('No se pudo iniciar el chat. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contactar Vendedor</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Escribe un mensaje para iniciar la negociación:
          </p>
          <Textarea 
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleStartChat} disabled={loading}>
            {loading ? "Iniciando conversación..." : "Enviar Mensaje"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}