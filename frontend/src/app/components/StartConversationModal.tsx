import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { apiRequest } from '../services/api';
import { toast } from 'sonner';

interface StartConversationModalProps {
  product: { id: string; name: string };
  sellerId: string;
  currentUser: { id: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StartConversationModal({ product, sellerId, currentUser, isOpen, onClose }: StartConversationModalProps) {
  const [message, setMessage] = useState(`Hola, estoy interesado en tu producto ${product?.name}...`);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStartConversation = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Prevent self-chat just in case
    if (String(currentUser.id) === String(sellerId)) {
      toast.error('No puedes iniciar una conversación contigo mismo.');
      onClose();
      return;
    }

    setLoading(true);
    try {
      // Always use the buyer flow from the product page: POST /api/chat
      // Seller-specific flows (e.g., seller-initiated from sales) should use the seller/chat endpoint elsewhere.
      const data = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ productID: product.id })
      });

      const convId = data?.id ?? data?.chatId ?? data?.chat_id ?? data?.chat?.id ?? data?.conversationId ?? data?.conversation_id ?? data?.conversation?.id;

      if (!convId) {
        toast.error('No se pudo obtener la conversación. Intenta de nuevo.');
        return;
      }

      // If the user entered an initial message, send it right after creating the chat
      if (message && message.trim().length > 0) {
        try {
          await apiRequest(`/api/chat/${convId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content: message })
          });
        } catch (msgErr) {
          console.error('Error sending initial message:', msgErr);
          // Don't block navigation on message send failure, but inform the user
          toast.error('Conversación creada, pero no se pudo enviar el mensaje inicial.');
        }
      }

      navigate(`/chat?open=${convId}`);
      onClose();
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 403) {
        toast.error('No tienes permisos para crear esta conversación.');
      } else if (e?.status === 404) {
        toast.error('Recurso no encontrado.');
      } else if (e?.status === 409) {
        toast.error('Ya existe una conversación para este producto.');
      } else {
        toast.error(e?.message || 'Error al iniciar la conversación.');
      }
      console.error('StartConversation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Iniciar conversación</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">Envía un mensaje para comenzar la negociación:</p>
          <Textarea value={message} onChange={(e) => setMessage((e.target as HTMLTextAreaElement).value)} className="min-h-[120px]" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleStartConversation} disabled={loading}>{loading ? 'Iniciando conversación...' : 'Enviar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
