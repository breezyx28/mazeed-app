import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification, mockNotifications, NotificationType } from '@/data/notifications';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const fetchNotifications = async (pageNum: number) => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * itemsPerPage, pageNum * itemsPerPage - 1);

      if (error) throw error;

      if (data) {
        const formatted: Notification[] = data.map(n => ({
          id: n.id,
          type: n.type as NotificationType,
          title: n.title,
          message: n.message,
          date: n.created_at,
          read: n.is_read
        }));

        if (pageNum === 1) {
          setNotifications(formatted);
        } else {
          setNotifications(prev => [...prev, ...formatted]);
        }
        if (count !== null) setTotalCount(count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
    
    // Subscribe to new notifications
    if (user) {
      const subscription = supabase
        .channel('notifications_changes')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const newNotif = payload.new;
          setNotifications(prev => [{
            id: newNotif.id,
            type: newNotif.type as NotificationType,
            title: newNotif.title,
            message: newNotif.message,
            date: newNotif.created_at,
            read: newNotif.is_read
          }, ...prev]);
          setTotalCount(prev => prev + 1);
          
          // Play sound for new notification
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
          
          toast(newNotif.title, {
            description: newNotif.message,
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const addNotification = async (newNotif: Omit<Notification, 'id' | 'date' | 'read'>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: newNotif.title,
          message: newNotif.message,
          type: newNotif.type,
          is_read: false
        });

      if (error) throw error;
      // The useEffect subscription will handle the local state update
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const hasMore = notifications.length < totalCount;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        loadMore,
        hasMore,
        isLoading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
