'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  BellRing,
  Check,
  Eye,
  ExternalLink,
  Settings,
  FileText,
  Scale,
  MessageSquare,
  Building2,
  AlertTriangle,
  Calendar,
  User,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/date';
import { useNotifications, type Notification } from '@/lib/hooks/useNotifications';
import { useAuth } from '@/lib/hooks/useAuth';

const notificationTypeIcons = {
  report_status: FileText,
  lawyer_response: Scale,
  discussion: MessageSquare,
  association: Building2,
  system: AlertTriangle
};

const notificationTypeColors = {
  report_status: 'text-blue-600',
  lawyer_response: 'text-purple-600',
  discussion: 'text-green-600',
  association: 'text-orange-600',
  system: 'text-red-600'
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}

function NotificationItem({ notification, onMarkAsRead, onClose }: NotificationItemProps) {
  const Icon = notificationTypeIcons[notification.type];

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onClose();
  };

  return (
    <div
      className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        !notification.read ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Icon className={`h-4 w-4 ${notificationTypeColors[notification.type]}`} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                {notification.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {notification.message}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{notification.senderName}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatRelativeTime(notification.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Unread indicator */}
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {notification.actionUrl && (
              <Link href={notification.actionUrl} onClick={handleClick}>
                <Button variant="outline" size="sm" className="text-xs h-6">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  확인
                </Button>
              </Link>
            )}
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="h-3 w-3 mr-1" />
                읽음
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationDropdown() {
  const { profile } = useAuth();
  const {
    unreadCount,
    markAsRead,
    markAllAsRead,
    getRecentNotifications,
    loading
  } = useNotifications(profile?.id);

  const [isOpen, setIsOpen] = useState(false);
  const recentNotifications = getRecentNotifications(5);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-orange-600" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0 min-w-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-96 p-0 max-h-[500px] overflow-hidden"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">알림</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount}개 읽지 않음
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs h-6"
                >
                  <Check className="h-3 w-3 mr-1" />
                  모두 읽음
                </Button>
              )}
              <Link href="/notifications/settings">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Settings className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="max-h-[360px] overflow-y-auto">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onClose={() => setIsOpen(false)}
              />
            ))
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">알림이 없습니다</h3>
              <p className="text-sm text-muted-foreground">
                새로운 알림이 있으면 여기에 표시됩니다
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {recentNotifications.length > 0 && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <Link href="/notifications" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" className="w-full text-sm" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                모든 알림 보기
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}