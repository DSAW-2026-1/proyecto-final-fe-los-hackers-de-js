import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { AlertTriangle, User, ArrowLeft, Loader2, ShieldAlert, MessageSquare } from 'lucide-react';
import { userService, UserProfileResponse } from '../services/userService';
import { adminService } from '../services/adminService';
import { ApiError } from '../services/api';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import Base64ImageLoader from './Base64ImageLoader';

export function AdminSuspendUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await userService.getProfileByUid(id);
        setUser(data);
      } catch (error) {
        console.error('Error fetching user for admin:', error);
        toast.error('No se pudo cargar la información del usuario');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [id]);

  const handleSuspend = async () => {
    if (!id) return;
    if (!reason.trim()) {
      toast.error('Por favor, indica una razón para la suspensión');
      return;
    }

    try {
      setSubmitting(true);
      await adminService.suspendUser(id, reason);
      toast.success('Usuario suspendido exitosamente');
      navigate('/admin');
    } catch (error: unknown) {
      console.error('Error suspending user:', error);
      const err = error as ApiError;
      if (err.status === 409) {
        toast.error('El usuario ya se encuentra suspendido');
      } else {
        toast.error(err.message || 'Error al suspender al usuario');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Usuario no encontrado</h2>
        <Button onClick={() => navigate('/admin')}>Volver al Panel</Button>
      </div>
    );
  }

  const initials = user.username?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Panel de Administración
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-8 h-8 text-destructive" />
            <h1 className="text-3xl font-bold text-primary">Moderación de Usuario</h1>
          </div>
          <p className="text-muted-foreground">Revisa el perfil antes de aplicar una suspensión.</p>
        </div>

        <Card className="p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
              {user.photo ? (
                <Base64ImageLoader data={user.photo} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-4xl">{initials}</AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <Badge variant="outline" className="text-xs">ID: {id?.substring(0, 8)}...</Badge>
              </div>
              <p className="text-lg text-muted-foreground mb-4">{user.career}</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-4 border-y">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reputación</p>
                  <p className="text-xl font-bold">{(parseFloat(user.reputation || '0') / 10).toFixed(1)} / 5.0</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ventas</p>
                  <p className="text-xl font-bold">{user.sales || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Compras</p>
                  <p className="text-xl font-bold">--</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8 border-destructive/20 bg-destructive/5">
          <div className="flex items-start gap-4 mb-6">
            <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-destructive mb-1">Zona de Peligro</h3>
              <p className="text-sm text-destructive/80">
                Al suspender a este usuario, se le revocará el acceso inmediato a su cuenta y se eliminarán todos sus productos publicados. Esta acción no se puede deshacer, incluso si el usuario es restaurado en el futuro.
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-destructive font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Razón de la Suspensión *
              </Label>
              <Textarea
                id="reason"
                placeholder="Explica detalladamente el motivo de la suspensión (reincidencia, fraude, comportamiento inadecuado...)"
                className="min-h-32 border-destructive/30 focus-visible:ring-destructive"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/admin')} disabled={submitting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suspendiendo...
                </>
              ) : (
                'Confirmar Suspensión'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
