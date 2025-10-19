// @CODE:NOTIFY-TYPES-001 | Chain: SPEC-NOTIFY-001 -> TEST-NOTIFY-001 -> CODE-NOTIFY-001
// Related: @SPEC:NOTIFY-001

/**
 * 알림 우선순위
 */
export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * 알림 카테고리
 */
export type NotificationCategory = 'REPORT' | 'CONSULT' | 'SYSTEM' | 'USER';

/**
 * 알림 타입
 */
export type NotificationType =
  // REPORT
  | 'report.created'
  | 'report.status_changed'
  | 'report.completed'
  // CONSULT
  | 'consult.assigned'
  | 'consult.accepted'
  | 'consult.message'
  | 'consult.completed'
  // SYSTEM
  | 'system.maintenance'
  | 'system.update'
  | 'system.alert'
  // USER
  | 'user.welcome'
  | 'user.password_reset'
  | 'user.account_locked';

/**
 * 알림 채널
 */
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

/**
 * 큐 상태
 */
export type QueueStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'dead';

/**
 * 알림 엔티티
 */
export interface Notification {
  id: number;
  recipientId: number;
  recipientRole: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  content?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date | null;
  sentAt: Date;
  createdAt: Date;
}

/**
 * 알림 생성 DTO
 */
export interface CreateNotificationDto {
  recipientId: number;
  recipientRole: string;
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  content?: string;
  actionUrl?: string;
}

/**
 * 알림 설정
 */
export interface NotificationSettings {
  id: number;
  userId: number;
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
  doNotDisturb: boolean;
  dndStart?: string; // HH:MM format
  dndEnd?: string;   // HH:MM format
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 알림 설정 업데이트 DTO
 */
export interface UpdateNotificationSettingsDto {
  inApp?: boolean;
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  doNotDisturb?: boolean;
  dndStart?: string;
  dndEnd?: string;
}

/**
 * 알림 큐 아이템
 */
export interface NotificationQueueItem {
  id: number;
  notificationId: number;
  channel: NotificationChannel;
  status: QueueStatus;
  retryCount: number;
  errorMessage?: string;
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
}

/**
 * 알림 템플릿
 */
export interface NotificationTemplate {
  id: number;
  type: NotificationType;
  category: NotificationCategory;
  titleTemplate: string;
  contentTemplate?: string;
  emailSubject?: string;
  emailBody?: string;
  variables?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 템플릿 생성 DTO
 */
export interface CreateTemplateDto {
  type: NotificationType;
  category: NotificationCategory;
  titleTemplate: string;
  contentTemplate?: string;
  emailSubject?: string;
  emailBody?: string;
  variables?: string[];
}

/**
 * 알림 필터
 */
export interface NotificationFilter {
  category?: NotificationCategory;
  priority?: NotificationPriority;
  isRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'priority' | 'readAt';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

/**
 * 알림 목록 결과
 */
export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

/**
 * 브로드캐스트 DTO
 */
export interface BroadcastNotificationDto {
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  content?: string;
  actionUrl?: string;
}

/**
 * 알림 전송 결과
 */
export interface NotificationSendResult {
  notificationId: number;
  channels: NotificationChannel[];
  success: boolean;
  errors?: Record<NotificationChannel, string>;
}

/**
 * 알림 통계
 */
export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  recentDays: number; // 최근 n일 내 알림 수
}