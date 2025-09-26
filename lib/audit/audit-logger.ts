import Database from 'better-sqlite3';
import path from 'path';
import { NextRequest } from 'next/server';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

export interface AuditLogEntry {
  user_id?: number | null;
  action: string;
  resource?: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  success?: boolean;
  error_message?: string;
}

export interface SecurityEvent {
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: number | null;
  ip_address?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface LoginAttempt {
  email: string;
  ip_address: string;
  success: boolean;
  failure_reason?: string;
  user_agent?: string;
}

export interface SessionLog {
  user_id: number;
  session_id: string;
  action: 'login' | 'logout' | 'expired';
  ip_address?: string;
  user_agent?: string;
}

class AuditLogger {
  private db: Database.Database;

  constructor() {
    this.db = new Database(dbPath);
  }

  /**
   * Log an audit event
   */
  async logAuditEvent(entry: AuditLogEntry): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent, session_id, success, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        entry.user_id || null,
        entry.action,
        entry.resource || null,
        entry.resource_id || null,
        entry.details || null,
        entry.ip_address || null,
        entry.user_agent || null,
        entry.session_id || null,
        entry.success !== false ? 1 : 0,
        entry.error_message || null
      );
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error to prevent disrupting the main application flow
    }
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO security_events (event_type, severity, user_id, ip_address, description, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        event.event_type,
        event.severity,
        event.user_id || null,
        event.ip_address || null,
        event.description,
        event.metadata ? JSON.stringify(event.metadata) : null
      );
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Log a login attempt
   */
  async logLoginAttempt(attempt: LoginAttempt): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO login_attempts (email, ip_address, success, failure_reason, user_agent)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        attempt.email,
        attempt.ip_address,
        attempt.success ? 1 : 0,
        attempt.failure_reason || null,
        attempt.user_agent || null
      );
    } catch (error) {
      console.error('Failed to log login attempt:', error);
    }
  }

  /**
   * Log a session event
   */
  async logSessionEvent(session: SessionLog): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO session_logs (user_id, session_id, action, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        session.user_id,
        session.session_id,
        session.action,
        session.ip_address || null,
        session.user_agent || null
      );
    } catch (error) {
      console.error('Failed to log session event:', error);
    }
  }

  /**
   * Get audit logs with filtering
   */
  getAuditLogs(filters: {
    user_id?: number;
    action?: string;
    resource?: string;
    success?: boolean;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      let query = `
        SELECT
          al.*,
          u.name as user_name,
          u.email as user_email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (filters.user_id) {
        query += ' AND al.user_id = ?';
        params.push(filters.user_id);
      }

      if (filters.action) {
        query += ' AND al.action = ?';
        params.push(filters.action);
      }

      if (filters.resource) {
        query += ' AND al.resource = ?';
        params.push(filters.resource);
      }

      if (filters.success !== undefined) {
        query += ' AND al.success = ?';
        params.push(filters.success ? 1 : 0);
      }

      if (filters.start_date) {
        query += ' AND al.created_at >= ?';
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ' AND al.created_at <= ?';
        params.push(filters.end_date);
      }

      query += ' ORDER BY al.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);

        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(filters.offset);
        }
      }

      return this.db.prepare(query).all(...params);
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Get security events with filtering
   */
  getSecurityEvents(filters: {
    event_type?: string;
    severity?: string;
    resolved?: boolean;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      let query = `
        SELECT
          se.*,
          u.name as user_name,
          u.email as user_email,
          resolver.name as resolved_by_name
        FROM security_events se
        LEFT JOIN users u ON se.user_id = u.id
        LEFT JOIN users resolver ON se.resolved_by = resolver.id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (filters.event_type) {
        query += ' AND se.event_type = ?';
        params.push(filters.event_type);
      }

      if (filters.severity) {
        query += ' AND se.severity = ?';
        params.push(filters.severity);
      }

      if (filters.resolved !== undefined) {
        query += ' AND se.resolved = ?';
        params.push(filters.resolved ? 1 : 0);
      }

      if (filters.start_date) {
        query += ' AND se.created_at >= ?';
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ' AND se.created_at <= ?';
        params.push(filters.end_date);
      }

      query += ' ORDER BY se.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);

        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(filters.offset);
        }
      }

      return this.db.prepare(query).all(...params);
    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }

  /**
   * Get login attempts with filtering
   */
  getLoginAttempts(filters: {
    email?: string;
    ip_address?: string;
    success?: boolean;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      let query = 'SELECT * FROM login_attempts WHERE 1=1';
      const params: any[] = [];

      if (filters.email) {
        query += ' AND email = ?';
        params.push(filters.email);
      }

      if (filters.ip_address) {
        query += ' AND ip_address = ?';
        params.push(filters.ip_address);
      }

      if (filters.success !== undefined) {
        query += ' AND success = ?';
        params.push(filters.success ? 1 : 0);
      }

      if (filters.start_date) {
        query += ' AND created_at >= ?';
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ' AND created_at <= ?';
        params.push(filters.end_date);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);

        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(filters.offset);
        }
      }

      return this.db.prepare(query).all(...params);
    } catch (error) {
      console.error('Failed to get login attempts:', error);
      return [];
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// Singleton instance
let auditLogger: AuditLogger | null = null;

export function getAuditLogger(): AuditLogger {
  if (!auditLogger) {
    auditLogger = new AuditLogger();
  }
  return auditLogger;
}

// Helper functions for common audit actions

/**
 * Extract IP address from request
 */
export function extractIpAddress(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') ||
         request.headers.get('x-real-ip') ||
         request.ip ||
         '127.0.0.1';
}

/**
 * Extract user agent from request
 */
export function extractUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || '';
}

/**
 * Create audit log entry from request
 */
export function createAuditEntry(
  request: NextRequest,
  action: string,
  options: Partial<AuditLogEntry> = {}
): AuditLogEntry {
  return {
    action,
    ip_address: extractIpAddress(request),
    user_agent: extractUserAgent(request),
    ...options
  };
}

// Common audit actions
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',

  // User Management
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_ROLE_CHANGE: 'user_role_change',

  // Association Management
  ASSOCIATION_CREATE: 'association_create',
  ASSOCIATION_UPDATE: 'association_update',
  ASSOCIATION_DELETE: 'association_delete',

  // Membership Management
  MEMBERSHIP_APPLY: 'membership_apply',
  MEMBERSHIP_APPROVE: 'membership_approve',
  MEMBERSHIP_REJECT: 'membership_reject',

  // Data Access
  DATA_VIEW: 'data_view',
  DATA_EXPORT: 'data_export',

  // System Admin
  SYSTEM_CONFIG_CHANGE: 'system_config_change',
  ADMIN_ACTION: 'admin_action'
} as const;

// Security event types
export const SECURITY_EVENT_TYPES = {
  SUSPICIOUS_LOGIN: 'suspicious_login',
  PRIVILEGE_ESCALATION: 'privilege_escalation',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  DATA_BREACH: 'data_breach',
  ACCOUNT_LOCKOUT: 'account_lockout',
  MULTIPLE_FAILED_LOGINS: 'multiple_failed_logins'
} as const;