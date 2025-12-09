import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification, mockNotifications, NotificationType } from '@/data/notifications';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  loadMore: () => void;
  hasMore: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10; // For load more simulation

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const addNotification = (newNotif: Omit<Notification, 'id' | 'date' | 'read'>) => {
    const notification: Notification = {
      ...newNotif,
      id: Date.now(),
      date: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [notification, ...prev]);
    
    // Play sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
    
    toast(newNotif.title, {
      description: newNotif.message,
    });
  };

  const loadMore = () => {
    // Simulate loading more data
    // In a real app, this would fetch from an API
    // For now, we just duplicate existing data with new IDs to simulate more items
    const moreNotifications = mockNotifications.map(n => ({
      ...n,
      id: Date.now() + Math.random(),
      date: new Date(new Date(n.date).getTime() - 1000 * 60 * 60 * 24 * 10).toISOString() // Shift dates back
    }));
    
    setNotifications(prev => [...prev, ...moreNotifications]);
    setPage(prev => prev + 1);
  };

  const hasMore = notifications.length < 50; // Limit for demo

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
