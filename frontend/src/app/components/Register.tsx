import { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Mail, Lock, Loader2, UserCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import UnisabanaLogoText from './../../../res/images/unisabana_logo_with_text_blue.png'

export function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (!formData.terms) {
      toast.error('Debes aceptar los términos y condiciones');
      return;
    }

    // Alphanumeric check for username
    if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      toast.error('El nombre de usuario debe ser alfanumérico');
      return;
    }

    // Institutional email check
    if (!formData.email.endsWith('@unisabana.edu.co')) {
      toast.error('Debes usar un correo institucional de la Universidad de La Sabana (@unisabana.edu.co)');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      login(response.token);
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      
      if (err instanceof Error && err.name === 'TypeError' && err.message.includes('fetch')) {
        toast.error('No se pudo conectar con el servidor. Verifica tu conexión.');
        return;
      }

      const error = err as { status?: number; data?: { message?: string } };
      
      if (error.status === 409) {
        toast.error('El usuario o correo ya existe');
      } else if (error.status === 400) {
        toast.error('Datos inválidos o incompletos');
      } else {
        toast.error('Error al crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-[#1e4976] flex items-center justify-center p-4 py-12">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-10" />

      <Card className="w-full max-w-2xl relative z-10 shadow-2xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <img
                src={UnisabanaLogoText}
                alt="Unisabana Logo"
                className="h-24 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">Crear Cuenta</h1>
            <p className="text-muted-foreground">
              Únete a la comunidad de Unisabana Marketplace
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>


            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Ej: JuanPerez2026"
                  className="pl-11"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Institucional</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@unisabana.edu.co"
                  className="pl-11"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Debes usar tu correo institucional de la Universidad de La Sabana
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2">
                <Checkbox 
                  id="terms" 
                  className="mt-1" 
                  checked={formData.terms}
                  onCheckedChange={(checked) => handleInputChange('terms', checked as boolean)}
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                  Acepto los{' '}
                  <Link to="#" className="text-primary hover:underline">
                    Términos y Condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link to="#" className="text-primary hover:underline">
                    Política de Privacidad
                  </Link>
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
