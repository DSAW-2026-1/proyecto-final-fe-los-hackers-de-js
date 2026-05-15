import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Avatar, AvatarFallback } from './ui/avatar';
import { AlertTriangle, Flag, ArrowLeft, Loader2, User, ShieldCheck } from 'lucide-react';
import { userService, UserProfileResponse } from '../services/userService';
import { toast } from 'sonner';
import Base64ImageLoader from './Base64ImageLoader';
import { ApiError } from '../services/api';

const REPORT_CATEGORIES = [
  { id: 'fake', label: 'Suplantación de identidad' },
  { id: 'scam', label: 'Estafa o fraude potencial' },
  { id: 'spam', label: 'Spam o duplicado' },
  { id: 'inappropriate', label: 'Comportamiento inadecuado u ofensivo' },
  { id: 'prohibited', label: 'Venta de productos prohibidos' },
  { id: 'other', label: 'Otro motivo' },
];

export function UserReportView() {
  const { id: uid } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    async function fetchUser() {
      if (!uid) return;
      try {
        setLoading(true);
        const data = await userService.getProfileByUid(uid);
        setUser(data);
      } catch (error) {
        console.error('Error fetching user for report:', error);
        toast.error('No se pudo cargar la información del usuario');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;

    if (!category) {
      toast.error('Por favor, selecciona una categoría');
      return;
    }
    if (!title.trim() || !body.trim()) {
      toast.error('Por favor, completa todos los campos del reporte');
      return;
    }

    try {
      setSubmitting(true);
      await userService.reportUser(uid, {
        category,
        reportTitle: title,
        reportBody: body
      });
      toast.success('Reporte enviado exitosamente. El equipo de moderación lo revisará pronto.');
      navigate(`/profile/${uid}`);
    } catch (error: unknown) {
      console.error('Error creating report:', error);
      const err = error as ApiError;
      
      if (err.status === 409) {
        toast.error('Ya has reportado a este usuario anteriormente.');
      } else if (err.status === 404) {
        toast.error('El usuario ya no existe.');
      } else {
        toast.error(err.message || 'Error al enviar el reporte. Por favor intenta más tarde.');
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
        <Button onClick={() => navigate('/')}>Volver al Inicio</Button>
      </div>
    );
  }

  const initials = user.username?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-left">
          <Button variant="ghost" onClick={() => navigate(`/profile/${uid}`)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Perfil
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Flag className="w-8 h-8 text-destructive" />
            <h1 className="text-3xl font-bold text-primary">Reportar Usuario</h1>
          </div>
          <p className="text-muted-foreground">Tu reporte ayuda a mantener segura la comunidad de Unisabana.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card className="p-6 mb-2">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border shadow-sm">
                {user.photo ? (
                  <Base64ImageLoader data={user.photo} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{user.username}</h3>
                <p className="text-sm text-muted-foreground">{user.career}</p>
                <Badge variant="outline" className="mt-2 text-xs">ID: {uid?.substring(0, 8)}...</Badge>
              </div>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <Card className="p-8">
              <div className="space-y-8">
                <div>
                  <Label className="text-base font-semibold mb-4 block">1. ¿Cuál es el problema?</Label>
                  <RadioGroup value={category} onValueChange={setCategory} className="grid grid-cols-1 gap-3">
                    {REPORT_CATEGORIES.map((cat) => (
                      <div key={cat.id} className={`flex items-center space-x-3 p-4 rounded-xl border transition-colors ${category === cat.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
                        <RadioGroupItem value={cat.id} id={cat.id} />
                        <label htmlFor={cat.id} className="flex-1 font-medium cursor-pointer text-sm sm:text-base">
                          {cat.label}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold block">2. Cuéntanos más detalles</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Título del reporte *</Label>
                    <Input 
                      id="title" 
                      placeholder="Ej: El usuario está usando fotos falsas" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="details">Descripción detallada *</Label>
                    <Textarea 
                      id="details" 
                      placeholder="Proporciona toda la información posible para ayudar a los moderadores (fechas, productos involucrados, etc.)..." 
                      className="min-h-32 resize-none"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="bg-destructive/5 p-4 rounded-lg flex gap-3 border border-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="text-xs text-destructive leading-relaxed">
                    <strong>Atención:</strong> Presentar reportes falsos o malintencionados puede resultar en la suspensión de tu propia cuenta institucional según el reglamento de convivencia del marketplace.
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                type="submit" 
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white h-12 text-lg font-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando Reporte...
                  </>
                ) : (
                  'Enviar Reporte'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="sm:w-32 h-12"
                onClick={() => navigate(`/profile/${uid}`)}
                disabled={submitting}
              >
                Cancelar
              </Button>
            </div>
          </form>

          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex gap-4">
              <ShieldCheck className="w-10 h-10 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-bold text-primary mb-1 text-left">Tu privacidad es importante</h4>
                <p className="text-sm text-muted-foreground leading-relaxed text-left">
                  Los reportes son totalmente confidenciales. El usuario no sabrá quién realizó la denuncia. Solo el equipo de administración de la Universidad de La Sabana podrá revisar esta información.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
