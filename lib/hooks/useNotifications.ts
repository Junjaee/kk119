import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'report_status' | 'lawyer_response' | 'discussion' | 'association' | 'system';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'report' | 'consultation' | 'shared_report' | 'association';
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: string;
  senderName?: string;
  senderRole?: 'system' | 'lawyer' | 'admin' | 'teacher';
  metadata?: {
    reportTitle?: string;
    consultationTitle?: string;
    associationName?: string;
    statusFrom?: string;
    statusTo?: string;
  };
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock data - in real app, this would be fetched from API
  const mockNotifications: Notification[] = [
    {
      id: 'notif1',
      type: 'report_status',
      title: '신고서 상태가 변경되었습니다',
      message: '귀하의 신고서가 처리중으로 변경되었습니다.',
      relatedId: 'report_123',
      relatedType: 'report',
      actionUrl: '/reports/report_123',
      priority: 'high',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      senderName: '시스템',
      senderRole: 'system',
    },
    {
      id: 'notif3',
      type: 'discussion',
      title: '새로운 토론 참여',
      message: '공유 신고서에 새로운 의견이 등록되었습니다.',
      relatedId: 'shared_789',
      relatedType: 'shared_report',
      actionUrl: '/shared-reports/shared_789',
      priority: 'medium',
      read: true,
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      senderName: '이선생',
      senderRole: 'teacher',
    }
  ];

  // Load notifications
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadNotifications = () => {
      try {
        // In real app, fetch from API
        // const response = await fetch(`/api/notifications?userId=${userId}`);
        // const data = await response.json();

        // For now, use mock data
        setNotifications(mockNotifications);
        updateUnreadCount(mockNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [userId]);

  // Update unread count
  const updateUnreadCount = useCallback((notifs: Notification[]) => {
    const count = notifs.filter(n => !n.read).length;
    setUnreadCount(count);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // In real app, send API request
      // await fetch(`/api/notifications/${notificationId}/mark-read`, { method: 'POST' });

      setNotifications(prev => {
        const updated = prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        );
        updateUnreadCount(updated);
        return updated;
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [updateUnreadCount]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      // In real app, send API request
      // await fetch(`/api/notifications/mark-all-read`, { method: 'POST' });

      setNotifications(prev => {
        const updated = prev.map(notif => ({ ...notif, read: true }));
        updateUnreadCount(updated);
        return updated;
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [updateUnreadCount]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // In real app, send API request
      // await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });

      setNotifications(prev => {
        const updated = prev.filter(notif => notif.id !== notificationId);
        updateUnreadCount(updated);
        return updated;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [updateUnreadCount]);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev];
      updateUnreadCount(updated);
      return updated;
    });
  }, [updateUnreadCount]);

  // Get recent notifications (for dropdown)
  const getRecentNotifications = useCallback((limit = 5) => {
    return notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    getRecentNotifications,
    getUnreadNotifications,
  };
}