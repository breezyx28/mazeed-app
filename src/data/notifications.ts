import { Package, Tag, TrendingUp, AlertCircle, CheckCircle, XCircle, Info, Truck, ShieldAlert } from "lucide-react";

export type NotificationType = 'success' | 'alert' | 'failure' | 'admin' | 'system' | 'delivery' | 'coupon_expired' | 'order';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string; // ISO date string
  read: boolean;
}

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'delivery',
    title: 'Order Delivered',
    message: 'Your order #ORD-2024-001 has been delivered successfully',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
  },
  {
    id: '2',
    type: 'coupon_expired',
    title: 'Coupon Expired',
    message: 'Your discount coupon SAVE20 has expired.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Payment Successful',
    message: 'Payment for order #ORD-2024-003 was successful.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
  },
  {
    id: '4',
    type: 'system',
    title: 'Complete Profile',
    message: 'Please complete your profile to get personalized recommendations.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: false,
  },
  {
    id: '5',
    type: 'alert',
    title: 'Flash Sale Alert',
    message: 'Flash sale starts in 1 hour. Don\'t miss out!',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    read: true,
  },
  {
    id: '6',
    type: 'failure',
    title: 'Payment Failed',
    message: 'Payment for order #ORD-2024-004 failed. Please try again.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
    read: true,
  },
  {
    id: '7',
    type: 'admin',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Saturday at 2:00 AM.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
    read: true,
  },
  {
    id: '8',
    type: 'system',
    title: 'Delivery Not Available',
    message: 'Delivery service is currently unavailable in your area.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(), // 6 days ago
    read: true,
  }
];

export const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success': return CheckCircle;
    case 'alert': return AlertCircle;
    case 'failure': return XCircle;
    case 'admin': return ShieldAlert;
    case 'system': return Info;
    case 'delivery': return Truck;
    case 'coupon_expired': return Tag;
    case 'order': return Package;
    default: return Info;
  }
};

export const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'success': return 'bg-green-500/10 text-green-500';
    case 'alert': return 'bg-yellow-500/10 text-yellow-500';
    case 'failure': return 'bg-red-500/10 text-red-500';
    case 'admin': return 'bg-purple-500/10 text-purple-500';
    case 'system': return 'bg-blue-500/10 text-blue-500';
    case 'delivery': return 'bg-orange-500/10 text-orange-500';
    case 'coupon_expired': return 'bg-gray-500/10 text-gray-500';
    case 'order': return 'bg-purple-500/10 text-purple-600';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const getNotificationEmoji = (type: NotificationType) => {
  switch (type) {
    case 'success': return '✅';
    case 'alert': return '⚠️';
    case 'failure': return '❌';
    case 'admin': return '🛡️';
    case 'system': return 'ℹ️';
    case 'delivery': return '🚚';
    case 'coupon_expired': return '🎫';
    case 'order': return '🛍️';
    default: return '📢';
  }
};
