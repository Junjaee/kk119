'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  BellRing,
  Check,
  X,
  FileText,
  MessageSquare,
  Scale,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Share2,
  Building2,
  Settings,
  Trash2,
  MarkAsRead,
  Filter,
  Calendar,
  User,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/date';
import { AuthGuard } from '@/components/auth/permission-guard';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAssociations } from '@/lib/hooks/useAssociations';

interface Notification {
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

const notificationTypeLabels = {
  report_status: '신고서 상태',
  lawyer_response: '변호사 답변',
  discussion: '토론 참여',
  association: '협회 활동',
  system: '시스템 공지'
};

const notificationTypeColors = {
  report_status: 'text-blue-600',
  lawyer_response: 'text-purple-600',
  discussion: 'text-green-600',
  association: 'text-orange-600',
  system: 'text-red-600'
};

const notificationTypeIcons = {
  report_status: FileText,
  lawyer_response: Scale,
  discussion: MessageSquare,
  association: Building2,
  system: AlertTriangle
};

const priorityColors = {
  low: 'border-l-gray-300',
  medium: 'border-l-blue-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-500'
};

export default function NotificationsPage() {
  const { profile } = useAuth();
  const { associations, userMemberships } = useAssociations(profile?.id);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Mock notifications data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: 'notif1',
        type: 'report_status',
        title: '신고서 상태가 변경되었습니다',
        message: '귀하의 신고서 "학교 내 괴롭힘 사건"의 상태가 처리중으로 변경되었습니다.',
        relatedId: 'report_123',
        relatedType: 'report',
        actionUrl: '/reports/report_123',
        priority: 'high',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        senderName: '시스템',
        senderRole: 'system',
        metadata: {
          reportTitle: '학교 내 괴롭힘 사건',
          statusFrom: 'pending',
          statusTo: 'processing'
        }
      },
      {
        id: 'notif3',
        type: 'discussion',
        title: '공유 신고서에 새로운 토론이 등록되었습니다',
        message: '이선생님이 "학부모 민원 대응 사례"에 새로운 의견을 남겼습니다.',
        relatedId: 'shared_789',
        relatedType: 'shared_report',
        actionUrl: '/shared-reports/shared_789',
        priority: 'medium',
        read: true,
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        senderName: '이선생',
        senderRole: 'teacher',
        metadata: {
          reportTitle: '학부모 민원 대응 사례'
        }
      },
      {
        id: 'notif4',
        type: 'association',
        title: '협회 가입이 승인되었습니다',
        message: '서울교사협회 가입 신청이 승인되었습니다. 이제 협회 서비스를 이용할 수 있습니다.',
        relatedId: 'assoc_1',
        relatedType: 'association',
        actionUrl: '/admin/associations',
        priority: 'medium',
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        senderName: '협회 관리자',
        senderRole: 'admin',
        metadata: {
          associationName: '서울교사협회'
        }
      },
      {
        id: 'notif5',
        type: 'system',
        title: '시스템 점검 안내',
        message: '2024년 1월 15일 02:00-04:00 시스템 점검이 예정되어 있습니다.',
        priority: 'low',
        read: false,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        senderName: '시스템 관리자',
        senderRole: 'admin'
      },
      {
        id: 'notif6',
        type: 'discussion',
        title: '귀하의 토론에 지지가 추가되었습니다',
        message: '익명 사용자가 귀하의 의견 "법적 절차 관련 조언"을 지지했습니다.',
        relatedId: 'shared_789',
        relatedType: 'shared_report',
        actionUrl: '/shared-reports/shared_789',
        priority: 'low',
        read: true,
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        senderName: '익명',
        senderRole: 'teacher'
      }
    ];

    setNotifications(mockNotifications);
    setLoading(false);
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesReadFilter = filter === 'all' ||
                             (filter === 'unread' && !notification.read) ||
                             (filter === 'read' && notification.read);

    const matchesTypeFilter = typeFilter === 'all' || notification.type === typeFilter;

    return matchesReadFilter && matchesTypeFilter;
  });

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  // Bulk actions
  const handleBulkMarkAsRead = async () => {
    setNotifications(prev =>
      prev.map(notif =>
        selectedNotifications.includes(notif.id) ? { ...notif, read: true } : notif
      )
    );
    setSelectedNotifications([]);
  };

  const handleBulkDelete = async () => {
    setNotifications(prev =>
      prev.filter(notif => !selectedNotifications.includes(notif.id))
    );
    setSelectedNotifications([]);
  };

  const toggleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredNotifications.map(notif => notif.id);
    setSelectedNotifications(visibleIds);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Bell className="h-8 w-8" />
                알림
                {unreadCount > 0 && (
                  <Badge variant="error" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-2">
                시스템 활동과 관련된 알림을 확인하세요
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                모두 읽음
              </Button>
              <Link href="/notifications/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  알림 설정
                </Button>
              </Link>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BellRing className="h-4 w-4 text-blue-600" />
                  <span className="ml-2 text-sm font-medium">총 알림</span>
                </div>
                <div className="text-2xl font-bold">{notifications.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 text-orange-600" />
                  <span className="ml-2 text-sm font-medium">읽지 않음</span>
                </div>
                <div className="text-2xl font-bold">{unreadCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="ml-2 text-sm font-medium">중요 알림</span>
                </div>
                <div className="text-2xl font-bold">
                  {notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="ml-2 text-sm font-medium">오늘</span>
                </div>
                <div className="text-2xl font-bold">
                  {notifications.filter(n => {
                    const today = new Date();
                    const notifDate = new Date(n.createdAt);
                    return notifDate.toDateString() === today.toDateString();
                  }).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="읽음 상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 알림</SelectItem>
                    <SelectItem value="unread">읽지 않음</SelectItem>
                    <SelectItem value="read">읽음</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="알림 유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 유형</SelectItem>
                    <SelectItem value="report_status">신고서 상태</SelectItem>
                    <SelectItem value="lawyer_response">변호사 답변</SelectItem>
                    <SelectItem value="discussion">토론 참여</SelectItem>
                    <SelectItem value="association">협회 활동</SelectItem>
                    <SelectItem value="system">시스템 공지</SelectItem>
                  </SelectContent>
                </Select>

                {selectedNotifications.length > 0 && (
                  <>
                    <Button variant="outline" onClick={handleBulkMarkAsRead}>
                      <Check className="h-4 w-4 mr-2" />
                      선택 읽음 ({selectedNotifications.length})
                    </Button>
                    <Button variant="outline" onClick={handleBulkDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      선택 삭제
                    </Button>
                  </>
                )}

                <Button variant="outline" onClick={selectAllVisible}>
                  전체 선택
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const Icon = notificationTypeIcons[notification.type];
              const isSelected = selectedNotifications.includes(notification.id);

              return (
                <Card
                  key={notification.id}
                  className={`hover:shadow-md transition-all border-l-4 ${priorityColors[notification.priority]} ${
                    !notification.read ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
                  } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectNotification(notification.id)}
                        className="mt-1 rounded"
                      />

                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800`}>
                          <Icon className={`h-5 w-5 ${notificationTypeColors[notification.type]}`} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{notification.senderName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatRelativeTime(notification.createdAt)}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {notificationTypeLabels[notification.type]}
                          </Badge>
                          {notification.priority === 'urgent' && (
                            <Badge variant="error" className="text-xs">
                              긴급
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                확인하기
                              </Button>
                            </Link>
                          )}
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              읽음 처리
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredNotifications.length === 0 && (
              <Card>
                <CardContent className="text-center py-16">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">알림이 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    {filter === 'unread'
                      ? '읽지 않은 알림이 없습니다.'
                      : typeFilter !== 'all'
                      ? '해당 유형의 알림이 없습니다.'
                      : '아직 받은 알림이 없습니다.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}