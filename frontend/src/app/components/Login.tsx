import { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Lock, Eye, EyeOff, Loader2, UserCircle} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import UnisabanaLogoText from "./../../../res/images/unisabana_logo_with_text_blue.png";

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor ingresa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({
        userOrEmail: email,
        password: password,
      });

      login(response.token);
      toast.success('¡Bienvenido de nuevo!');
      navigate('/');
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      if (err instanceof Error && err.name === 'TypeError' && err.message.includes('fetch')) {
        toast.error('No se pudo conectar con el servidor. Verifica tu conexión.');
        return;
      }

      const error = err as { status?: number; data?: { message?: string } };
      
      if (error.status === 400) {
        toast.error('Credenciales inválidas');
      } else if (error.status === 403) {
        toast.error('Tu cuenta está suspendida. Contacta a soporte.');
      } else {
        toast.error('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-[#1e4976] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-10" />

      <Card className="w-full max-w-md relative z-10 shadow-2xl">
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
            <h1 className="text-3xl font-bold text-primary mb-2">Bienvenido</h1>
            <p className="text-muted-foreground">
              Ingresa a Unisabana Marketplace
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Usuario o Correo Institucional</Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Usuario o correo@unisabana.edu.co"
                  className="pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-11 pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm cursor-pointer">
                  Recordarme
                </label>
              </div>
              <Link to="#" className="text-sm text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
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
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
