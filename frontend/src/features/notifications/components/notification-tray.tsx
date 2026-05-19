import { useEffect, useState } from 'react';
import { notificationApi } from '../services/notification-api';
import type { NotificationItem } from '../services/notification-api';
import { 
  X, 
  Bell, 
  MessageSquare, 
  UserCheck, 
  Terminal, 
  Check, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { wsManager } from '../../../websocket/websocket-manager';

interface NotificationTrayProps {
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

export default function NotificationTray({ onClose, onUnreadCountChange }: NotificationTrayProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [liveToast, setLiveToast] = useState<NotificationItem | null>(null);

  // Load notifications and subscribe to WebSocket topic
  useEffect(() => {
    notificationApi.getNotifications().then((list) => {
      setNotifications(list);
      onUnreadCountChange(list.filter(n => !n.read).length);
    });

    // Subscribe to real-time alerts
    wsManager.subscribe('/topic/notifications', (alert: NotificationItem) => {
      setNotifications(prev => {
        const next = [alert, ...prev];
        onUnreadCountChange(next.filter(n => !n.read).length);
        return next;
      });

      // Display active Toast Banner overlay
      setLiveToast(alert);
      setTimeout(() => setLiveToast(null), 5000); // clear toast after 5s
    });

    return () => {
      wsManager.unsubscribe('/topic/notifications');
    };
  }, [onUnreadCountChange]);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      onUnreadCountChange(0);
    } catch (err) {
      console.error('Mark all as read failed:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      onUnreadCountChange(notifications.filter(n => n.id !== id && !n.read).length);
    } catch (err) {
      console.error('Mark as read failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      const next = notifications.filter(n => n.id !== id);
      setNotifications(next);
      onUnreadCountChange(next.filter(n => !n.read).length);
    } catch (err) {
      console.error('Delete notification failed:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'assignment':
        return <UserCheck className="w-4 h-4 text-blue-400" />;
      default:
        return <Terminal className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'mention':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'assignment':
        return 'bg-blue-500/10 border-blue-500/20';
      default:
        return 'bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <>
      {/* Dark backdrop blur mask */}
      <div 
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-all duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full md:w-[420px] bg-card border-l border-border z-50 flex flex-col shadow-premium font-sans"
      >
        {/* Header Section */}
        <div className="p-5 border-b border-border flex items-center justify-between shrink-0 bg-zinc-950/20">
          <div className="flex items-center gap-2 text-left">
            <Bell className="w-4.5 h-4.5 text-zinc-400" />
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 font-bold tracking-widest uppercase">Inbox</span>
              <span className="text-[10px] text-primary font-bold">STOMP Notification Hub</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllAsRead}
              className="px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-800 text-[10px] text-zinc-300 font-bold border border-border flex items-center gap-1 transition-all"
              title="Mark all as read"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Alerts Viewport */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-left">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-xs gap-2">
              <AlertCircle className="w-6 h-6 text-zinc-600" />
              Your inbox is completely clear.
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id}
                className={`p-3.5 rounded-xl border transition-all flex gap-3 relative overflow-hidden group ${
                  n.read 
                    ? 'bg-zinc-950/5 border-border/40 hover:bg-zinc-950/10' 
                    : 'bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-premium-glow shadow-primary/5'
                }`}
              >
                {/* Visual Unread dot indicator bar */}
                {!n.read && (
                  <div className="absolute left-0 inset-y-0 w-1 bg-primary" />
                )}

                {/* Badge icon */}
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${getBadgeColor(n.type)}`}>
                  {getIcon(n.type)}
                </div>

                {/* Alert details */}
                <div className="flex-1 space-y-1 pr-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white leading-tight">{n.title}</span>
                    <span className="text-[9px] text-zinc-500 font-medium">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">{n.message}</p>
                  <span className="text-[9px] text-zinc-500 font-bold block mt-1">Sender: {n.senderName}</span>
                </div>

                {/* Hover control triggers */}
                <div className="absolute right-3.5 bottom-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-10">
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1 rounded bg-zinc-800 border border-border hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1 rounded bg-zinc-800 border border-border hover:bg-red-950/30 hover:border-red-900/40 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Delete event"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* System footer */}
        <div className="p-3 bg-zinc-950/20 border-t border-border text-[9px] text-zinc-500 font-semibold text-center flex items-center justify-center gap-1.5 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Active STOMP Messaging Channel Secured
        </div>
      </motion.div>

      {/* --- REAL-TIME SCREEN-EDGE TOAST OVERLAY --- */}
      <AnimatePresence>
        {liveToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-80 bg-zinc-900/95 backdrop-blur-md border border-primary/30 p-4 rounded-xl shadow-premium flex gap-3 text-left overflow-hidden"
          >
            {/* Pulsing light border effect */}
            <div className="absolute inset-y-0 left-0 w-1 bg-primary animate-pulse" />
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${getBadgeColor(liveToast.type)}`}>
              {getIcon(liveToast.type)}
            </div>
            <div className="flex-1 space-y-0.5">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Live Alert received</span>
              <span className="text-xs font-bold text-white leading-tight block">{liveToast.title}</span>
              <p className="text-[11px] text-zinc-400 leading-normal">{liveToast.message}</p>
            </div>
            <button 
              onClick={() => setLiveToast(null)}
              className="text-zinc-500 hover:text-white shrink-0 self-start"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
