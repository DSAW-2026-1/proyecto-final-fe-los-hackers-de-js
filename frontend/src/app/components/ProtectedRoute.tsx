import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Module-level variable to debounce authentication toasts across mounts (Strict Mode)
let lastAuthToastTime = 0;
const TOAST_DEBOUNCE_MS = 500;

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      const now = Date.now();
      if (now - lastAuthToastTime > TOAST_DEBOUNCE_MS) {
        lastAuthToastTime = now;
        toast.error('Debes iniciar sesión para acceder a esta página');
      }
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
