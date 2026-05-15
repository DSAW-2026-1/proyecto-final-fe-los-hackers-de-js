import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { 
  Bell, 
  Package, 
  MessageCircle, 
  Tag, 
  Info, 
  CheckCircle2, 
  ShoppingBag,
  ArrowRight,
  LucideIcon,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { userService, NotificationItem as APINotification } from '../services/userService';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  topicID: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

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

export function Notifications() {
  const navigate = useNavigate();
  const { unreadCount, setUnreadCount, decrementUnreadCount, incrementUnreadCount, refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async (pageNum: number, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const response = await userService.getNotifications(pageNum);
      
      const newNotifications = Object.values(response.results).map((item: APINotification) => ({
        id: item.notificationID,
        type: item.type,
        title: item.title,
        description: item.message,
        time: formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: es }),
        read: item.read,
        topicID: item.topicID,
        ...getNotificationStyles(item.type)
      }));

      if (isLoadMore) {
        setNotifications(prev => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }
      
      setTotalPages(response.pages);
      // Refresh global count to match
      refreshUnreadCount();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, [refreshUnreadCount]);

  const loadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, true);
    }
  };

  const toggleReadState = async (id: string, currentState: boolean) => {
    try {
      const newState = !currentState;
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: newState } : n));
      
      if (newState) {
        decrementUnreadCount();
      } else {
        incrementUnreadCount();
      }

      await userService.markNotificationState(id, newState);
    } catch (error) {
      console.error('Error toggling notification state:', error);
      // Revert if error
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: currentState } : n));
      if (!currentState) {
        decrementUnreadCount();
      } else {
        incrementUnreadCount();
      }
      toast.error('No se pudo actualizar el estado de la notificación');
    }
  };

  const handleViewDetail = (type: string, topicID: string) => {
    if (!topicID) return;

    switch (type) {
      case 'review':
      case 'promotion':
        navigate(`/product/${topicID}`);
        break;
      case 'purchase':
      case 'sale':
        navigate(`/seller/orders/${topicID}/update`);
        break;
      case 'orderUpdate':
      case 'shipping':
        navigate(`/orders/${topicID}/status`);
        break;
      case 'message':
        navigate(`/chat?uid=${topicID}`);
        break;
      default:
        // System or other types might not have a specific view
        break;
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      // Optimistic update for currently visible notifications
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      await userService.markAllNotificationsRead();
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert is complex if we only have the current view, 
      // but for "mark all read" usually a refetch or partial revert is better.
      // For simplicity in this UI, we'll just show the error as it hits the backend.
      toast.error('No se pudieron marcar todas las notificaciones como leídas');
      fetchNotifications(1); // Refetch to be safe
    }
  };

  const renderNotificationList = (filterType?: string | string[]) => {
    let filtered = notifications;
    if (filterType) {
      if (Array.isArray(filterType)) {
        filtered = notifications.filter(n => filterType.includes(n.type));
      } else if (filterType === 'unread') {
        filtered = notifications.filter(n => !n.read);
      } else {
        filtered = notifications.filter(n => n.type === filterType);
      }
    }

    if (loading && page === 1) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (filtered.length === 0) {
      return <EmptyNotifications message={filterType === 'unread' ? "No tienes notificaciones sin leer." : undefined} />;
    }

    return (
      <div className="space-y-4">
        {filtered.map((notif) => (
          <NotificationItem 
            key={notif.id} 
            notif={notif} 
            onToggleRead={() => toggleReadState(notif.id, notif.read)}
            onViewDetail={
              ['review', 'promotion', 'purchase', 'sale', 'orderUpdate', 'shipping', 'message'].includes(notif.type) && notif.topicID 
                ? () => handleViewDetail(notif.type, notif.topicID) 
                : undefined
            }
          />
        ))}
        {page < totalPages && (
          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={loadMore} 
              disabled={loadingMore}
              className="gap-2"
            >
              {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
              Cargar más notificaciones
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-muted/30 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-primary">Notificaciones</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-6 px-2">
                  {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Mantente al tanto de tus ventas, compras y actividad en el marketplace.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
              Marcar todas como leídas
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white border w-full md:w-auto overflow-x-auto justify-start h-auto p-1">
            <TabsTrigger value="all" className="py-2 px-6">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="py-2 px-6">Sin leer</TabsTrigger>
            <TabsTrigger value="sales" className="py-2 px-6">Ventas</TabsTrigger>
            <TabsTrigger value="purchases" className="py-2 px-6">Compras</TabsTrigger>
            <TabsTrigger value="system" className="py-2 px-6">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {renderNotificationList()}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {renderNotificationList('unread')}
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            {renderNotificationList('sale')}
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            {renderNotificationList(['purchase', 'shipping', 'orderUpdate', 'promotion'])}
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            {renderNotificationList('system')}
          </TabsContent>
        </Tabs>

        <Card className="mt-12 p-6 bg-primary/5 border-primary/10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Preferencias de Notificación</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Puedes configurar cómo recibes estas notificaciones (email, app, o ambos) en tus ajustes de perfil.
              </p>
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary"
                onClick={() => navigate('/profile/edit#notification-settings')}
              >
                Configurar notificaciones <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function NotificationItem({ notif, onToggleRead, onViewDetail }: { 
  notif: Notification; 
  onToggleRead: () => void;
  onViewDetail?: () => void;
}) {
  const Icon = notif.icon;
  
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${notif.read ? 'opacity-80' : 'border-l-4 border-l-primary'}`}>
      <div className="p-4 sm:p-6 flex gap-4">
        <div className={`w-12 h-12 rounded-xl ${notif.bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${notif.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h3 className={`font-semibold text-lg leading-tight truncate ${notif.read ? 'text-muted-foreground' : 'text-primary'}`}>
              {notif.title}
            </h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap pt-1">
              {notif.time}
            </span>
          </div>
          <p className={`text-sm mb-4 leading-relaxed ${notif.read ? 'text-muted-foreground' : 'text-foreground'}`}>
            {notif.description}
          </p>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant={notif.read ? "ghost" : "secondary"} onClick={onToggleRead} className="h-8">
              {notif.read ? "Marcar como no leída" : "Marcar como leída"}
            </Button>
            {onViewDetail && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 text-muted-foreground"
                onClick={onViewDetail}
              >
                Ver detalle
              </Button>
            )}
          </div>
        </div>
        
        {!notif.read && (
          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
        )}
      </div>
    </Card>
  );
}

function EmptyNotifications({ message = "No tienes notificaciones en este momento." }: { message?: string }) {
  return (
    <Card className="p-12 text-center border-dashed">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Bell className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="font-semibold text-lg mb-1">Bandeja Vacía</h3>
      <p className="text-muted-foreground">{message}</p>
    </Card>
  );
}
