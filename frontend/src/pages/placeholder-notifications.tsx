import { useState } from 'react';
import { notificationApi } from '../features/notifications/services/notification-api';
import type { NotificationItem } from '../features/notifications/services/notification-api';
import { 
  Bell, 
  MessageSquare, 
  UserCheck, 
  Terminal, 
  Check, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PlaceholderNotifications() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch notifications
  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: notificationApi.getNotifications
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], (prev: NotificationItem[] | undefined) => 
        (prev || []).map(n => ({ ...n, read: true }))
      );
      showSuccess('All notifications marked as read.');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: notificationApi.deleteNotification,
    onSuccess: (_, id) => {
      queryClient.setQueryData(['notifications'], (prev: NotificationItem[] | undefined) => 
        (prev || []).filter(n => n.id !== id)
      );
    }
  });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
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
    <div className="p-8 max-w-4xl mx-auto flex flex-col space-y-6 font-sans text-left">
      
      {/* Header section */}
      <div className="flex justify-between items-center border-b border-border pb-5 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">System Inbox</h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">
            Review mentions, project assignments, and cluster alerts
          </p>
        </div>

        <button
          onClick={() => markAllReadMutation.mutate()}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-semibold border border-border flex items-center gap-1.5 transition-colors"
        >
          <Check className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      {/* Success banner alert */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Notifications list grid */}
      <div className="space-y-3.5">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-card/20 rounded-2xl border border-border text-zinc-500 text-sm gap-2">
            <AlertCircle className="w-7 h-7 text-zinc-600 animate-pulse" />
            Your inbox is completely clear. Enjoy the quiet!
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex gap-4 relative overflow-hidden group ${
                n.read 
                  ? 'bg-zinc-950/5 border-border/40 hover:bg-zinc-950/10' 
                  : 'bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-premium'
              }`}
            >
              {/* Badge Icon indicator */}
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${getBadgeColor(n.type)}`}>
                {getIcon(n.type)}
              </div>

              {/* Message Details */}
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white tracking-tight">{n.title}</span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed mt-0.5">{n.message}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[9px] bg-zinc-800/40 border border-border/30 px-2 py-0.5 rounded text-zinc-500 font-bold uppercase tracking-wider">
                    Sender: {n.senderName}
                  </span>
                </div>
              </div>

              {/* Hover controls actions */}
              <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <button
                  onClick={() => deleteMutation.mutate(n.id)}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-border hover:bg-red-950/20 text-zinc-500 hover:text-red-400 transition-colors"
                  title="Delete Alert"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
