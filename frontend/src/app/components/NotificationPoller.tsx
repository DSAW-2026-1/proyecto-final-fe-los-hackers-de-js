import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService, NotificationItem } from '../services/userService';
import { useNotifications } from '../context/NotificationContext';
import { toast } from 'sonner';
import { MessageCircle, Package, ShoppingBag, Tag, Info, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router';

// Helper to get standard notification colors/icons
const getNotificationStyles = (type: string) => {
  switch (type) {
    case 'purchase':
    case 'sale':
      return { icon: ShoppingBag, color: 'text-blue-600', bgColor: 'bg-blue-100' };
    case 'shipping':
    case 'orderUpdate':
      return { icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-100' };
    case 'message':
      return { icon: MessageCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
    case 'review':
    case 'promotion':
      return { icon: Tag, color: 'text-pink-600', bgColor: 'bg-pink-100' };
    case 'system':
      return { icon: CheckCircle2, color: 'text-purple-600', bgColor: 'bg-purple-100' };
    default:
      return { icon: Info, color: 'text-gray-600', bgColor: 'bg-gray-100' };
  }
};

export function NotificationPoller() {
  const { isAuthenticated } = useAuth();
  const { refreshUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const lastCheckRef = useRef<string>(new Date().toISOString());
  const pollingInterval = Number(import.meta.env.VITE_NOTIFICATION_POLLING_INTERVAL) || 30000;

  useEffect(() => {
    if (!isAuthenticated) return;

    const poll = async () => {
      try {
        const response = await userService.getNotificationsSince(lastCheckRef.current);
        
        // Update last check timestamp to now
        lastCheckRef.current = new Date().toISOString();

        if (response && response.results) {
          const newNotifications = Object.values(response.results);
          
          if (newNotifications.length > 0) {
            // New notifications found, refresh global unread count
            refreshUnreadCount();
          }

          newNotifications.forEach((notif: NotificationItem) => {
            const styles = getNotificationStyles(notif.type);
            const Icon = styles.icon;

            toast(
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${styles.bgColor} ${styles.color} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight text-primary truncate">
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end border-t pt-2 mt-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] uppercase tracking-wider font-bold py-0"
                    onClick={() => {
                        navigate('/notifications');
                        toast.dismiss();
                    }}
                  >
                    Ver notificaciones
                  </Button>
                </div>
              </div>,
              {
                duration: 5000,
                position: 'bottom-right',
                icon: null, // We handle icons in the custom content
              }
            );
          });
        }
      } catch (error) {
        // Silently fail polling errors to avoid annoying the user
        // But log for developers
        console.warn('Notification polling error:', error);
      }
    };

    const interval = setInterval(poll, pollingInterval);
    
    // Initial check after a short delay
    const initialTimeout = setTimeout(poll, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [isAuthenticated, pollingInterval, navigate, refreshUnreadCount]);

  return null; // This component doesn't render anything itself
}
