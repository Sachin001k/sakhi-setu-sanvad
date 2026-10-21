import { useState, useEffect, useCallback } from 'react';
import { Bell, X, Heart, Activity, FileText, MessageCircle, Video, Bot, User, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NOTIFICATIONS_CHANGED_EVENT } from '@/lib/notifications';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean | null;
  created_at: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadError, setLoadError] = useState(false);

  const userId = user?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, type, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
      setLoadError(true);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const formatted: Notification[] = ((data as NotificationRow[] | null) ?? []).map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      created_at: n.created_at,
      read: n.is_read ?? false
    }));

    setLoadError(false);
    setNotifications(formatted);
    setUnreadCount(formatted.filter(n => !n.read).length);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    // Other components call createNotification() from '@/lib/notifications',
    // which fires this event after inserting.
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, fetchNotifications);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, fetchNotifications);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    const target = notifications.find(n => n.id === notificationId);
    if (!target || target.read) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'symptom':
        return <Activity className="w-4 h-4 text-orange-500" />;
      case 'post':
      case 'community':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-red-500" />;
      case 'report':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'reminder':
        return <Heart className="w-4 h-4 text-pink-500" />;
      case 'ai':
        return <Bot className="w-4 h-4 text-purple-500" />;
      case 'profile':
        return <User className="w-4 h-4 text-indigo-500" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'tip':
        return <Heart className="w-4 h-4 text-pink-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-4 h-4 md:w-5 md:h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed sm:absolute right-4 sm:right-0 top-16 sm:top-12 w-[calc(100vw-2rem)] sm:w-80 max-w-sm sm:max-w-80 max-h-96 overflow-hidden z-50"
          >
            <Card className="shadow-lg border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs h-6 px-2"
                      >
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-64 overflow-y-auto">
                  {loadError ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      <p>Couldn't load notifications.</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchNotifications}
                        className="text-xs h-6 px-2 mt-2"
                      >
                        Try again
                      </Button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-700 ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${
                                  notification.read 
                                    ? 'text-gray-900 dark:text-gray-100' 
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {notification.title}
                                </p>
                                <span className={`text-xs ${
                                  notification.read 
                                    ? 'text-gray-700 dark:text-gray-300' 
                                    : 'text-muted-foreground'
                                }`}>
                                  {formatTimeAgo(notification.created_at)}
                                </span>
                              </div>
                              <p className={`text-xs mt-1 line-clamp-2 ${
                                notification.read 
                                  ? 'text-gray-800 dark:text-gray-200' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
