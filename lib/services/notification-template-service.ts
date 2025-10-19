/**
 * @SPEC:NOTIFY-001
 * 알림 템플릿 서비스
 */

import Database from 'better-sqlite3';
import {
  NotificationTemplate,
  CreateTemplateDto,
  NotificationType,
} from '../types/notification';

export class NotificationTemplateService {
  private db: Database.Database;

  constructor(dbPathOrDb: string | Database.Database = './data/kyokwon119.db') {
    if (typeof dbPathOrDb === 'string') {
      this.db = new Database(dbPathOrDb);
    } else {
      this.db = dbPathOrDb;
    }
    this.initDatabase();
  }

  /**
   * 데이터베이스 초기화
   */
  private initDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(30) NOT NULL,
        title_template VARCHAR(200) NOT NULL,
        content_template TEXT,
        email_subject VARCHAR(200),
        email_body TEXT,
        variables JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  /**
   * 템플릿 생성
   */
  async createTemplate(data: CreateTemplateDto): Promise<NotificationTemplate> {
    const result = this.db.prepare(`
      INSERT INTO notification_templates (
        type, category, title_template, content_template,
        email_subject, email_body, variables
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.type,
      data.category,
      data.titleTemplate,
      data.contentTemplate || null,
      data.emailSubject || null,
      data.emailBody || null,
      data.variables ? JSON.stringify(data.variables) : null
    );

    return this.getTemplateById(result.lastInsertRowid as number);
  }

  /**
   * 템플릿 조회 (ID)
   */
  private getTemplateById(id: number): NotificationTemplate {
    const template = this.db.prepare(`
      SELECT * FROM notification_templates WHERE id = ?
    `).get(id) as any;

    return this.mapTemplate(template);
  }

  /**
   * 템플릿 조회 (타입)
   */
  async getTemplate(type: NotificationType): Promise<NotificationTemplate | null> {
    const template = this.db.prepare(`
      SELECT * FROM notification_templates
      WHERE type = ? AND is_active = 1
    `).get(type) as any;

    if (!template) return null;

    return this.mapTemplate(template);
  }

  /**
   * 모든 템플릿 조회
   */
  async getAllTemplates(): Promise<NotificationTemplate[]> {
    const templates = this.db.prepare(`
      SELECT * FROM notification_templates
      ORDER BY category, type
    `).all() as any[];

    return templates.map(t => this.mapTemplate(t));
  }

  /**
   * 활성 템플릿 조회
   */
  async getActiveTemplates(): Promise<NotificationTemplate[]> {
    const templates = this.db.prepare(`
      SELECT * FROM notification_templates
      WHERE is_active = 1
      ORDER BY category, type
    `).all() as any[];

    return templates.map(t => this.mapTemplate(t));
  }

  /**
   * 템플릿 업데이트
   */
  async updateTemplate(
    type: NotificationType,
    data: Partial<CreateTemplateDto>
  ): Promise<NotificationTemplate | null> {
    const template = await this.getTemplate(type);
    if (!template) return null;

    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [];

    if (data.titleTemplate !== undefined) {
      updates.push('title_template = ?');
      params.push(data.titleTemplate);
    }
    if (data.contentTemplate !== undefined) {
      updates.push('content_template = ?');
      params.push(data.contentTemplate);
    }
    if (data.emailSubject !== undefined) {
      updates.push('email_subject = ?');
      params.push(data.emailSubject);
    }
    if (data.emailBody !== undefined) {
      updates.push('email_body = ?');
      params.push(data.emailBody);
    }
    if (data.variables !== undefined) {
      updates.push('variables = ?');
      params.push(JSON.stringify(data.variables));
    }

    params.push(type);

    this.db.prepare(`
      UPDATE notification_templates
      SET ${updates.join(', ')}
      WHERE type = ?
    `).run(...params);

    return this.getTemplate(type);
  }

  /**
   * 템플릿 활성화/비활성화
   */
  async setTemplateActive(type: NotificationType, isActive: boolean): Promise<boolean> {
    const result = this.db.prepare(`
      UPDATE notification_templates
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE type = ?
    `).run(isActive ? 1 : 0, type);

    return result.changes > 0;
  }

  /**
   * 템플릿 삭제
   */
  async deleteTemplate(type: NotificationType): Promise<boolean> {
    const result = this.db.prepare(`
      DELETE FROM notification_templates WHERE type = ?
    `).run(type);

    return result.changes > 0;
  }

  /**
   * 템플릿 변수 검증
   */
  async validateVariables(
    type: NotificationType,
    variables: Record<string, string>
  ): Promise<{ valid: boolean; missing: string[] }> {
    const template = await this.getTemplate(type);
    if (!template || !template.variables) {
      return { valid: true, missing: [] };
    }

    // filter를 사용하여 누락된 변수만 추출
    const missing = template.variables.filter(required => !(required in variables));

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * 템플릿 렌더링 (미리보기)
   */
  async renderTemplate(
    type: NotificationType,
    variables: Record<string, string>
  ): Promise<{ title: string; content: string; emailSubject?: string; emailBody?: string } | null> {
    const template = await this.getTemplate(type);
    if (!template) return null;

    return {
      title: this.substituteVariables(template.titleTemplate, variables),
      content: this.substituteVariables(template.contentTemplate || '', variables),
      emailSubject: template.emailSubject ? this.substituteVariables(template.emailSubject, variables) : undefined,
      emailBody: template.emailBody ? this.substituteVariables(template.emailBody, variables) : undefined,
    };
  }

  /**
   * 템플릿에서 변수 치환
   */
  private substituteVariables(text: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }, text);
  }

  /**
   * 기본 템플릿 초기화
   */
  async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates: CreateTemplateDto[] = [
      {
        type: 'report.created',
        category: 'REPORT',
        titleTemplate: '신고가 접수되었습니다 - {{reportNo}}',
        contentTemplate: '{{teacherName}}님의 신고가 성공적으로 접수되었습니다. 신고 번호는 {{reportNo}}입니다.',
        variables: ['reportNo', 'teacherName'],
      },
      {
        type: 'report.status_changed',
        category: 'REPORT',
        titleTemplate: '신고 상태가 변경되었습니다',
        contentTemplate: '신고 #{{reportNo}}의 상태가 {{oldStatus}}에서 {{newStatus}}로 변경되었습니다.',
        variables: ['reportNo', 'oldStatus', 'newStatus'],
      },
      {
        type: 'consult.assigned',
        category: 'CONSULT',
        titleTemplate: '변호사가 배정되었습니다',
        contentTemplate: '{{lawyerName}} 변호사가 귀하의 상담에 배정되었습니다.',
        variables: ['lawyerName'],
      },
      {
        type: 'consult.message',
        category: 'CONSULT',
        titleTemplate: '새로운 메시지가 도착했습니다',
        contentTemplate: '{{senderName}}님이 메시지를 보냈습니다.',
        variables: ['senderName'],
      },
      {
        type: 'system.alert',
        category: 'SYSTEM',
        titleTemplate: '{{title}}',
        contentTemplate: '{{content}}',
        variables: ['title', 'content'],
      },
    ];

    for (const template of defaultTemplates) {
      try {
        await this.createTemplate(template);
      } catch (error) {
        // 이미 존재하는 경우 무시
        if (error instanceof Error && error.message.includes('UNIQUE')) {
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * 템플릿 매핑
   */
  private mapTemplate(data: any): NotificationTemplate {
    return {
      id: data.id,
      type: data.type,
      category: data.category,
      titleTemplate: data.title_template,
      contentTemplate: data.content_template,
      emailSubject: data.email_subject,
      emailBody: data.email_body,
      variables: data.variables ? JSON.parse(data.variables) : undefined,
      isActive: data.is_active === 1,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * 데이터베이스 연결 종료
   */
  close(): void {
    this.db.close();
  }
}