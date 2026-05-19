import { api } from '../../../shared/services/api';

export interface NotificationItem {
  id: string;
  type: 'mention' | 'assignment' | 'system';
  title: string;
  message: string;
  senderName: string;
  read: boolean;
  createdAt: string;
}

let mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'mention',
    title: 'Mentioned in #general',
    message: 'Welcome to the CollabMatrix Enterprise (CME) developer backplane chat system!',
    senderName: 'Lead Architect',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  },
  {
    id: 'n2',
    type: 'assignment',
    title: 'New Task Assigned',
    message: 'Assigned CME-SPEC-DOC-2026 for review.',
    senderName: 'DevOps Lead',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'n3',
    type: 'system',
    title: 'Deployment Successful',
    message: 'Kubernetes Pod cluster-outbox-v2 is 100% healthy.',
    senderName: 'KubeBot',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  }
];

export const notificationApi = {
  // Get all notifications
  getNotifications: async (): Promise<NotificationItem[]> => {
    try {
      const res = await api.get('/notifications');
      return res.data?.data || res.data;
    } catch {
      return Promise.resolve(mockNotifications);
    }
  },

  // Mark notification as read
  markAsRead: async (id: string): Promise<void> => {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      mockNotifications = mockNotifications.map(n => n.id === id ? { ...n, read: true } : n);
    }
  },

  // Mark all as read
  markAllAsRead: async (): Promise<void> => {
    try {
      await api.post('/notifications/read-all');
    } catch {
      mockNotifications = mockNotifications.map(n => ({ ...n, read: true }));
    }
  },

  // Delete notification
  deleteNotification: async (id: string): Promise<void> => {
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      mockNotifications = mockNotifications.filter(n => n.id !== id);
    }
  }
};
