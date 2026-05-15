import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { authService } from '../services/authService';

interface UserInfo {
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  isSeller: boolean;
  uid: string | null;
  user: UserInfo | null;
  login: (token: string) => void;
  logout: (showToast?: boolean) => void;
  adminLogin: (token: string) => void;
  adminLogout: () => void;
  setUserInfo: (user: UserInfo) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(authService.isAdminAuthenticated());
  const [isSeller, setIsSeller] = useState<boolean>(authService.isSeller());
  const [uid, setUid] = useState<string | null>(authService.getUid());
  const [user, setUser] = useState<UserInfo | null>(null);

  const logout = useCallback((showToast: boolean = true) => {
    authService.logout();
    setIsAuthenticated(false);
    setIsSeller(false);
    setUid(null);
    setUser(null);
    if (showToast) {
      toast.success('Sesión cerrada correctamente');
    }
  }, []);

  const login = useCallback((token: string) => {
    authService.setToken(token);
    setIsAuthenticated(true);
    setIsSeller(authService.isSeller());
    setUid(authService.getUid());
  }, []);

  const adminLogin = useCallback((token: string) => {
    authService.setAdminToken(token);
    setIsAdminAuthenticated(true);
  }, []);

  const adminLogout = useCallback(() => {
    authService.adminLogout();
    setIsAdminAuthenticated(false);
  }, []);

  const setUserInfo = useCallback((userInfo: UserInfo) => {
    setUser(userInfo);
  }, []);

  useEffect(() => {
    // Sync state if token changes elsewhere (e.g. storage event)
    const handleStorageChange = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setIsAdminAuthenticated(authService.isAdminAuthenticated());
      setIsSeller(authService.isSeller());
      setUid(authService.getUid());
    };
    window.addEventListener('storage', handleStorageChange);

    const handleAuthExpired = (e: Event) => {
      const customEvent = e as CustomEvent;
      const isAdmin = customEvent.detail?.isAdmin;

      if (isAdmin) {
        adminLogout();
        toast.error('Tu sesión de administrador ha expirado. Por favor, ingresa de nuevo.');
      } else {
        logout(false);
        toast.error('Tu sesión ha expirado. Por favor, ingresa de nuevo.');
      }
    };
    window.addEventListener('auth-token-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-token-expired', handleAuthExpired);
    };
  }, [logout, adminLogout]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isAdminAuthenticated, 
      isSeller,
      uid,
      user,
      login, 
      logout,
      adminLogin,
      adminLogout,
      setUserInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
