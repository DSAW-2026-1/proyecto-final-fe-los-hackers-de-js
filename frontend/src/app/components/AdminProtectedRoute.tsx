import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

// Module-level variable to debounce authentication toasts across mounts (Strict Mode)
let lastAuthToastTime = 0;
const TOAST_DEBOUNCE_MS = 500;

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAdminAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminAuthenticated) {
      const now = Date.now();
      if (now - lastAuthToastTime > TOAST_DEBOUNCE_MS) {
        lastAuthToastTime = now;
        toast.error('Debes ser administrador para acceder a esta página');
      }
      navigate('/admin/login');
    }
  }, [isAdminAuthenticated, navigate]);

  if (!isAdminAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
