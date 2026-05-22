/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { apiRequest } from '../services/api';
import { toast } from 'sonner';

interface ContactBuyerModalProps {
  saleId: string;
  product: { id: string; name: string };
  buyer: { uid?: string; id?: string; username: string };
  isOpen: boolean;
  onClose: () => void;
}

export function ContactBuyerModal({ saleId, product, buyer, isOpen, onClose }: ContactBuyerModalProps) {
  const [message, setMessage] = useState(
    `Hola ${buyer?.username || 'comprador'}, te escribo con respecto al envío de tu compra de ${product?.name}...`
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStartChat = async () => {
    setLoading(true);

    try {
      let convId: string | undefined;

      try {
        const responseData = await apiRequest<{ chatId?: string; id?: string }>('/api/seller/chat', {
          method: 'POST',
          body: JSON.stringify({ saleID: saleId })
        });
        convId = responseData?.chatId ?? responseData?.id;
      } catch (err: any) {
        if (err?.status === 409) {
          // Conversation already exists. Handle the 409 response gracefully.
          const errData = err.data;
          convId = errData?.chatId ?? errData?.id ?? errData?.chat_id ?? errData?.conversationId ?? errData?.conversation_id;

          if (!convId) {
            // Fallback: search my chats to find matching credentials
            try {
              const myChats = await apiRequest<any[]>('/api/chat/my?limit=50&offset=0');
              const matched = myChats?.find((c: any) => {
                const isProductMatch = String(c.product?.id || c.product?._id) === String(product.id);
                const isBuyerMatch = String(c.otherUser?.id || c.otherUser?.uid || c.otherUser?.UID) === String(buyer.uid || buyer.id);
                return isProductMatch && isBuyerMatch;
              });
              if (matched) {
                convId = String(matched.id || matched._id);
              }
            } catch (findErr) {
              console.error('Error searching existing conversations:', findErr);
            }
          }
        } else {
          // Re-throw other errors
          throw err;
        }
      }

      if (!convId) {
        throw new Error('No se pudo encontrar o crear la conversación.');
      }

      // Send initial message if typed and not empty
      if (message && message.trim().length > 0) {
        try {
          await apiRequest(`/api/chat/${convId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content: message })
          });
        } catch (msgErr) {
          console.warn('Conversación iniciada, pero no se pudo enviar el mensaje inicial', msgErr);
        }
      }

      toast.success('Conversación iniciada correctamente.');
      navigate(`/chat?open=${convId}`);
      onClose();
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast.error(error?.message || 'No se pudo iniciar el chat. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contactar Comprador</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Escribe un mensaje para iniciar la conversación con el comprador:
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
            {loading ? 'Iniciando...' : 'Enviar mensaje'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
