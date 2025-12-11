import { ArrowLeft, Check, Filter, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/context/NotificationContext";
import { getNotificationColor, getNotificationEmoji, getNotificationIcon, NotificationType } from "@/data/notifications";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";

const Notifications = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loadMore, hasMore } = useNotifications();
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    
    if (filterDate !== 'all') {
      const date = new Date(n.date);
      const now = new Date();
      if (filterDate === 'today') {
        return date.toDateString() === now.toDateString();
      } else if (filterDate === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      } else if (filterDate === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= monthAgo;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">{t('notifications')}</h1>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-primary text-xs">
                {t('markAllRead')}
              </Button>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Filter className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t('filterNotifications')}</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  {/* Type Filter */}
                  <div className="space-y-3">
                    <Label>{t('type')}</Label>
                    <RadioGroup value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="type-all" />
                        <Label htmlFor="type-all">{t('all')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="success" id="type-success" />
                        <Label htmlFor="type-success">{t('success')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="alert" id="type-alert" />
                        <Label htmlFor="type-alert">{t('alert')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="failure" id="type-failure" />
                        <Label htmlFor="type-failure">{t('failure')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="type-admin" />
                        <Label htmlFor="type-admin">{t('admin')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="system" id="type-system" />
                        <Label htmlFor="type-system">{t('system')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery" id="type-delivery" />
                        <Label htmlFor="type-delivery">{t('delivery')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="coupon_expired" id="type-coupon" />
                        <Label htmlFor="type-coupon">{t('couponExpired')}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Date Filter */}
                  <div className="space-y-3">
                    <Label>{t('date')}</Label>
                    <RadioGroup value={filterDate} onValueChange={(v) => setFilterDate(v as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="date-all" />
                        <Label htmlFor="date-all">{t('anyTime')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="today" id="date-today" />
                        <Label htmlFor="date-today">{t('today')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="week" id="date-week" />
                        <Label htmlFor="date-week">{t('last7Days')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="month" id="date-month" />
                        <Label htmlFor="date-month">{t('last30Days')}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {t('noNotificationsFound')}
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`bg-card rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-md ${
                    !notification.read
                      ? "border-primary/20 bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-12 h-12 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center flex-shrink-0 text-xl`}>
                      {getNotificationEmoji(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {hasMore && filteredNotifications.length > 0 && (
            <Button 
              variant="outline" 
              className="w-full mt-4 rounded-full"
              onClick={loadMore}
            >
              {t('loadMore')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
