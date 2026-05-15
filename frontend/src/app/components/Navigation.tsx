import { ShoppingCart, Bell, User, Search, Menu, LogIn, UserPlus, Settings, LogOut, ShoppingBag } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { userService } from '../services/userService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

import UnisabanaLogo from "./../../../res/images/unisabana_logo_blue.png"

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function Navigation() {
  const { isAuthenticated, user, setUserInfo, logout, isSeller } = useAuth();
  const { totalItems } = useCart();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !user) {
      userService.getProfile().then(profile => {
        setUserInfo({
          username: profile.username,
          email: profile.email
        });
      }).catch(err => {
        console.error('Failed to fetch user profile in navigation:', err);
      });
    }
  }, [isAuthenticated, user, setUserInfo]);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          <div className="flex items-center gap-2 sm:gap-8 shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={UnisabanaLogo}
                alt="Unisabana Logo"
                className="w-10 h-10 object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="hidden lg:block">
                <div className="font-bold text-primary">Unisabana</div>
                <div className="text-xs text-muted-foreground">Marketplace</div>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `text-sm transition-colors ${isActive ? 'text-primary font-medium' : 'hover:text-primary'}`
                }
              >
                Inicio
              </NavLink>
              <NavLink 
                to="/search" 
                className={({ isActive }) => 
                  `text-sm transition-colors ${isActive ? 'text-primary font-medium' : 'hover:text-primary'}`
                }
              >
                Productos
              </NavLink>
              {isAuthenticated && (
                <>
                  {isSeller && (
                    <NavLink 
                      to="/seller" 
                      className={({ isActive }) => 
                        `text-sm transition-colors ${isActive ? 'text-primary font-medium' : 'hover:text-primary'}`
                      }
                    >
                      Mis Ventas
                    </NavLink>
                  )}
                  <NavLink 
                    to="/chat" 
                    className={({ isActive }) => 
                      `text-sm transition-colors ${isActive ? 'text-primary font-medium' : 'hover:text-primary'}`
                    }
                  >
                    Mensajes
                  </NavLink>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center lg:justify-end min-w-0 px-2 sm:px-4">
            <form 
              className="relative w-full lg:w-80"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const query = formData.get('query') as string;
                if (query.trim()) {
                  navigate(`/search?query=${encodeURIComponent(query)}`);
                }
              }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="query"
                placeholder="Buscar..."
                className="pl-10 h-9 w-full"
              />
              <button type="submit" className="hidden" />
            </form>
          </div>

          <div className="flex items-center gap-1 sm:gap-4 shrink-0">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-accent text-xs">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/notifications">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-accent text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/res/images/avatar_placeholder.png" alt="Usuario" />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.username || 'Mi Cuenta'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email || 'cargando...'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer w-full flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer w-full flex items-center">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>Mis Pedidos</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile/edit" className="cursor-pointer w-full flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configuración</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost">
                      <LogIn className="w-4 h-4 mr-2" />
                      Ingresar
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-primary hover:bg-primary/90">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Registrarse
                    </Button>
                  </Link>
                </div>
                <div className="flex sm:hidden items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-1 ring-border">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">Invitado</p>
                          <p className="text-xs leading-none text-muted-foreground italic">
                            No has iniciado sesión
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/login" className="cursor-pointer w-full flex items-center">
                          <LogIn className="mr-2 h-4 w-4" />
                          <span>Ingresar</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/register" className="cursor-pointer w-full flex items-center">
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Registrarse</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/" className="w-full">Inicio</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/search" className="w-full">Productos</Link>
                </DropdownMenuItem>
                {isAuthenticated && (
                  <>
                    {isSeller && (
                      <DropdownMenuItem asChild>
                        <Link to="/seller" className="w-full">Mis Ventas</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/chat" className="w-full">Mensajes</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
