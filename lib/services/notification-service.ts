/**
 * Notification Service for Lawyer Assignment System
 * Handles multi-channel notifications for lawyer assignments and related events
 */

export interface NotificationTemplate {
  id: string;
  type: 'lawyer_assignment' | 'assignment_update' | 'client_notification' | 'admin_alert';
  channel: 'email' | 'push' | 'sms' | 'in_app';
  subject_template: string;
  body_template: string;
  variables: string[];
}

export interface NotificationRecipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  push_token?: string;
  role: 'lawyer' | 'client' | 'admin';
  preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
    in_app: boolean;
  };
}

export interface NotificationRequest {
  template_id: string;
  recipient_ids: string[];
  variables: Record<string, string>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_at?: string;
  expires_at?: string;
}

export interface NotificationLog {
  id: string;
  request_id: string;
  recipient_id: string;
  channel: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'expired';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

// Pre-defined notification templates
const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'lawyer_assignment_notification',
    type: 'lawyer_assignment',
    channel: 'email',
    subject_template: '[교권119] 새로운 상담 건이 배정되었습니다 - {{report_title}}',
    body_template: `안녕하세요 {{lawyer_name}} 변호사님,

새로운 상담 건이 배정되었습니다.

**신고 정보**
- 제목: {{report_title}}
- 유형: {{report_type}}
- 우선순위: {{priority}}
- 신고자: {{client_name}}
- 발생일: {{incident_date}}

**배정 정보**
- 배정일: {{assigned_date}}
- 배정 관리자: {{assigned_by}}
- 참고사항: {{notes}}

상세 내용은 교권119 변호사 포털에서 확인하실 수 있습니다.
로그인 후 '배정된 상담' 메뉴를 이용해 주세요.

**중요**: {{priority}} 우선순위 건이므로 빠른 대응 부탁드립니다.

감사합니다.
교권119 관리팀`,
    variables: ['lawyer_name', 'report_title', 'report_type', 'priority', 'client_name', 'incident_date', 'assigned_date', 'assigned_by', 'notes']
  },
  {
    id: 'client_assignment_notification',
    type: 'client_notification',
    channel: 'email',
    subject_template: '[교권119] 변호사가 배정되었습니다 - {{report_title}}',
    body_template: `안녕하세요,

귀하의 신고 건에 전문 변호사가 배정되었습니다.

**신고 정보**
- 제목: {{report_title}}
- 접수일: {{submitted_date}}

**배정된 변호사**
- 성명: {{lawyer_name}}
- 소속: {{law_firm}}
- 전문분야: {{specialization}}
- 평균 응답시간: {{avg_response_time}}

**다음 단계**
변호사가 귀하의 사건을 검토한 후 연락드릴 예정입니다.
긴급한 상황이거나 문의사항이 있으시면 교권119 고객센터(1588-0119)로 연락 주세요.

**상담 진행 현황**은 교권119 마이페이지에서 실시간으로 확인하실 수 있습니다.

교권 침해로부터 보호받을 권리, 교권119가 함께 하겠습니다.

감사합니다.
교권119 관리팀`,
    variables: ['report_title', 'submitted_date', 'lawyer_name', 'law_firm', 'specialization', 'avg_response_time']
  },
  {
    id: 'admin_assignment_alert',
    type: 'admin_alert',
    channel: 'in_app',
    subject_template: '변호사 배정 완료 - {{report_title}}',
    body_template: '{{lawyer_name}} 변호사에게 {{report_title}} 건이 성공적으로 배정되었습니다. 우선순위: {{priority}}',
    variables: ['lawyer_name', 'report_title', 'priority']
  },
  {
    id: 'lawyer_assignment_push',
    type: 'lawyer_assignment',
    channel: 'push',
    subject_template: '새 상담 배정',
    body_template: '{{report_type}} 관련 새로운 상담 건이 배정되었습니다.',
    variables: ['report_type']
  }
];

export class NotificationService {
  private static instance: NotificationService;
  private templates: Map<string, NotificationTemplate>;
  private notificationLogs: NotificationLog[] = [];

  private constructor() {
    this.templates = new Map();
    NOTIFICATION_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send notification for lawyer assignment
   */
  async sendLawyerAssignmentNotification(data: {
    lawyer: NotificationRecipient;
    client: NotificationRecipient;
    report_title: string;
    report_type: string;
    priority: number;
    incident_date: string;
    assigned_date: string;
    assigned_by: string;
    notes?: string;
    law_firm: string;
    specialization: string[];
    avg_response_time: string;
    submitted_date: string;
  }): Promise<{ success: boolean; logs: NotificationLog[] }> {
    const results: NotificationLog[] = [];

    try {
      // Send notification to lawyer
      const lawyerNotification = await this.sendNotification({
        template_id: 'lawyer_assignment_notification',
        recipient_ids: [data.lawyer.id],
        variables: {
          lawyer_name: data.lawyer.name,
          report_title: data.report_title,
          report_type: this.getTypeLabel(data.report_type),
          priority: this.getPriorityLabel(data.priority),
          client_name: data.client.name,
          incident_date: data.incident_date,
          assigned_date: data.assigned_date,
          assigned_by: data.assigned_by,
          notes: data.notes || '별도 참고사항 없음'
        },
        priority: data.priority <= 2 ? 'urgent' : 'high'
      });
      results.push(...lawyerNotification.logs);

      // Send push notification to lawyer if preferences allow
      if (data.lawyer.preferences.push) {
        const pushNotification = await this.sendNotification({
          template_id: 'lawyer_assignment_push',
          recipient_ids: [data.lawyer.id],
          variables: {
            report_type: this.getTypeLabel(data.report_type)
          },
          priority: 'high'
        });
        results.push(...pushNotification.logs);
      }

      // Send notification to client
      const clientNotification = await this.sendNotification({
        template_id: 'client_assignment_notification',
        recipient_ids: [data.client.id],
        variables: {
          report_title: data.report_title,
          submitted_date: data.submitted_date,
          lawyer_name: data.lawyer.name,
          law_firm: data.law_firm,
          specialization: data.specialization.join(', '),
          avg_response_time: data.avg_response_time
        },
        priority: 'medium'
      });
      results.push(...clientNotification.logs);

      return { success: true, logs: results };
    } catch (error) {
      console.error('Failed to send lawyer assignment notifications:', error);
      return { success: false, logs: results };
    }
  }

  /**
   * Send notification based on template and recipients
   */
  async sendNotification(request: NotificationRequest): Promise<{ success: boolean; logs: NotificationLog[] }> {
    const template = this.templates.get(request.template_id);
    if (!template) {
      throw new Error(`Template not found: ${request.template_id}`);
    }

    const logs: NotificationLog[] = [];
    const requestId = this.generateId();

    for (const recipientId of request.recipient_ids) {
      const log: NotificationLog = {
        id: this.generateId(),
        request_id: requestId,
        recipient_id: recipientId,
        channel: template.channel,
        status: 'pending',
        retry_count: 0,
        max_retries: request.priority === 'urgent' ? 5 : 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        // Simulate sending notification
        await this.deliverNotification(template, recipientId, request.variables, log);
        log.status = 'sent';
        log.sent_at = new Date().toISOString();

        // Simulate delivery confirmation (in real implementation, this would be async)
        setTimeout(() => {
          log.status = 'delivered';
          log.delivered_at = new Date().toISOString();
          log.updated_at = new Date().toISOString();
        }, 1000);

      } catch (error) {
        log.status = 'failed';
        log.error_message = error instanceof Error ? error.message : 'Unknown error';
        log.updated_at = new Date().toISOString();
      }

      logs.push(log);
      this.notificationLogs.push(log);
    }

    return { success: logs.every(log => log.status === 'sent'), logs };
  }

  /**
   * Get notification logs with optional filtering
   */
  getNotificationLogs(filters?: {
    recipient_id?: string;
    channel?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
  }): NotificationLog[] {
    let logs = [...this.notificationLogs];

    if (filters) {
      if (filters.recipient_id) {
        logs = logs.filter(log => log.recipient_id === filters.recipient_id);
      }
      if (filters.channel) {
        logs = logs.filter(log => log.channel === filters.channel);
      }
      if (filters.status) {
        logs = logs.filter(log => log.status === filters.status);
      }
      if (filters.from_date) {
        logs = logs.filter(log => log.created_at >= filters.from_date!);
      }
      if (filters.to_date) {
        logs = logs.filter(log => log.created_at <= filters.to_date!);
      }
    }

    return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(recipientId?: string): Promise<void> {
    const failedLogs = this.notificationLogs.filter(log =>
      log.status === 'failed' &&
      log.retry_count < log.max_retries &&
      (!recipientId || log.recipient_id === recipientId)
    );

    for (const log of failedLogs) {
      try {
        log.retry_count++;
        log.status = 'pending';
        log.updated_at = new Date().toISOString();

        // Retry the notification (simplified implementation)
        await new Promise(resolve => setTimeout(resolve, 100));

        log.status = 'sent';
        log.sent_at = new Date().toISOString();
        log.updated_at = new Date().toISOString();
      } catch (error) {
        log.status = 'failed';
        log.error_message = error instanceof Error ? error.message : 'Retry failed';
        log.updated_at = new Date().toISOString();
      }
    }
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(days: number = 7): {
    total_sent: number;
    total_delivered: number;
    total_failed: number;
    delivery_rate: number;
    avg_delivery_time: number;
    channel_breakdown: Record<string, number>;
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentLogs = this.notificationLogs.filter(log =>
      new Date(log.created_at) >= cutoffDate
    );

    const totalSent = recentLogs.filter(log => log.status === 'sent' || log.status === 'delivered').length;
    const totalDelivered = recentLogs.filter(log => log.status === 'delivered').length;
    const totalFailed = recentLogs.filter(log => log.status === 'failed').length;
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

    // Calculate average delivery time
    const deliveredLogs = recentLogs.filter(log => log.status === 'delivered' && log.sent_at && log.delivered_at);
    const avgDeliveryTime = deliveredLogs.length > 0
      ? deliveredLogs.reduce((sum, log) => {
          const sentTime = new Date(log.sent_at!).getTime();
          const deliveredTime = new Date(log.delivered_at!).getTime();
          return sum + (deliveredTime - sentTime);
        }, 0) / deliveredLogs.length
      : 0;

    // Channel breakdown
    const channelBreakdown: Record<string, number> = {};
    recentLogs.forEach(log => {
      channelBreakdown[log.channel] = (channelBreakdown[log.channel] || 0) + 1;
    });

    return {
      total_sent: totalSent,
      total_delivered: totalDelivered,
      total_failed: totalFailed,
      delivery_rate: Math.round(deliveryRate * 100) / 100,
      avg_delivery_time: Math.round(avgDeliveryTime / 1000), // in seconds
      channel_breakdown: channelBreakdown
    };
  }

  private async deliverNotification(
    template: NotificationTemplate,
    recipientId: string,
    variables: Record<string, string>,
    log: NotificationLog
  ): Promise<void> {
    // Simulate different delivery mechanisms based on channel
    switch (template.channel) {
      case 'email':
        await this.sendEmail(template, recipientId, variables);
        break;
      case 'push':
        await this.sendPushNotification(template, recipientId, variables);
        break;
      case 'sms':
        await this.sendSMS(template, recipientId, variables);
        break;
      case 'in_app':
        await this.sendInAppNotification(template, recipientId, variables);
        break;
      default:
        throw new Error(`Unsupported channel: ${template.channel}`);
    }
  }

  private async sendEmail(template: NotificationTemplate, recipientId: string, variables: Record<string, string>): Promise<void> {
    // In a real implementation, this would integrate with email service (SendGrid, AWS SES, etc.)
    const subject = this.replaceVariables(template.subject_template, variables);
    const body = this.replaceVariables(template.body_template, variables);

    console.log(`[EMAIL] Sending to ${recipientId}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body.substring(0, 100)}...`);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async sendPushNotification(template: NotificationTemplate, recipientId: string, variables: Record<string, string>): Promise<void> {
    // In a real implementation, this would integrate with push service (Firebase FCM, etc.)
    const subject = this.replaceVariables(template.subject_template, variables);
    const body = this.replaceVariables(template.body_template, variables);

    console.log(`[PUSH] Sending to ${recipientId}:`);
    console.log(`Title: ${subject}`);
    console.log(`Message: ${body}`);

    // Simulate push notification delay
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async sendSMS(template: NotificationTemplate, recipientId: string, variables: Record<string, string>): Promise<void> {
    // In a real implementation, this would integrate with SMS service (Twilio, AWS SNS, etc.)
    const message = this.replaceVariables(template.body_template, variables);

    console.log(`[SMS] Sending to ${recipientId}: ${message}`);

    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  private async sendInAppNotification(template: NotificationTemplate, recipientId: string, variables: Record<string, string>): Promise<void> {
    // In a real implementation, this would store in database and trigger real-time updates
    const subject = this.replaceVariables(template.subject_template, variables);
    const body = this.replaceVariables(template.body_template, variables);

    console.log(`[IN-APP] Creating notification for ${recipientId}:`);
    console.log(`Title: ${subject}`);
    console.log(`Message: ${body}`);

    // Simulate in-app notification creation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    return result;
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      parent: '학부모 민원',
      student: '학생 폭력',
      verbal: '욕설 및 폭언',
      defamation: '명예훼손',
      harassment: '성희롱',
      threat: '협박',
      other: '기타'
    };
    return labels[type] || type;
  }

  private getPriorityLabel(priority: number): string {
    const labels: Record<number, string> = {
      1: '긴급',
      2: '높음',
      3: '보통',
      4: '낮음',
      5: '매우낮음'
    };
    return labels[priority] || '보통';
  }

  private generateId(): string {
    return 'notif_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}