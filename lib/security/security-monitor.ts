import { log } from '@/lib/utils/logger';
import { sessionManager } from '@/lib/auth/session-manager';
import { enhancedAuth } from '@/lib/auth/enhanced-auth';

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: number;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  details: Record<string, any>;
  metadata: {
    requestId?: string;
    endpoint?: string;
    method?: string;
    responseTime?: number;
  };
}

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGIN_SUSPICIOUS'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_BLACKLISTED'
  | 'SESSION_CREATED'
  | 'SESSION_EXPIRED'
  | 'SESSION_INVALIDATED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'BRUTE_FORCE_ATTACK'
  | 'IP_CHANGE'
  | 'DEVICE_CHANGE'
  | 'PRIVILEGE_ESCALATION'
  | 'UNAUTHORIZED_ACCESS'
  | 'DATA_ACCESS'
  | 'SUSPICIOUS_ACTIVITY'
  | 'SECURITY_VIOLATION'
  | 'ACCOUNT_LOCKOUT'
  | 'PASSWORD_CHANGE'
  | 'TWO_FACTOR_AUTH'
  | 'API_ABUSE';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  type: string;
  severity: SecuritySeverity;
  message: string;
  userId?: number;
  ipAddress?: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  acknowledged: boolean;
  details: Record<string, any>;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  activeThreats: number;
  topRiskUsers: Array<{ userId: number; riskScore: number; email?: string }>;
  topRiskIPs: Array<{ ipAddress: string; riskScore: number; eventCount: number }>;
  recentAlerts: SecurityAlert[];
  systemHealth: {
    authenticationFailureRate: number;
    rateLimitViolations: number;
    suspiciousActivityScore: number;
    lastUpdate: Date;
  };
}

// In-memory storage (should be moved to persistent storage in production)
const securityEvents: SecurityEvent[] = [];
const securityAlerts: SecurityAlert[] = [];
const ipRiskScores = new Map<string, number>();
const userRiskScores = new Map<number, number>();
const eventCounts = new Map<string, number>();

export class SecurityMonitor {
  private alertThresholds = {
    failedLogins: { count: 5, timeWindow: 15 * 60 * 1000 }, // 5 failed logins in 15 minutes
    rateLimitViolations: { count: 3, timeWindow: 5 * 60 * 1000 }, // 3 violations in 5 minutes
    ipChanges: { count: 3, timeWindow: 60 * 60 * 1000 }, // 3 IP changes in 1 hour
    suspiciousActivity: { count: 10, timeWindow: 60 * 60 * 1000 } // 10 suspicious events in 1 hour
  };

  /**
   * Record a security event
   */
  recordEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    details: Record<string, any>,
    metadata: {
      requestId?: string;
      endpoint?: string;
      method?: string;
      responseTime?: number;
      userId?: number;
      userEmail?: string;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    } = {}
  ): void {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      severity,
      userId: metadata.userId,
      userEmail: metadata.userEmail,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      sessionId: metadata.sessionId,
      details,
      metadata: {
        requestId: metadata.requestId,
        endpoint: metadata.endpoint,
        method: metadata.method,
        responseTime: metadata.responseTime
      }
    };

    // Store event
    securityEvents.push(event);

    // Update risk scores
    this.updateRiskScores(event);

    // Check for alert conditions
    this.checkAlertConditions(event);

    // Log to main logger
    // Convert any numeric userId to string for logging compatibility
    const logMetadata = {
      ...details,
      ...metadata,
      eventId: event.id,
      ...(metadata?.userId && typeof metadata.userId === 'number' ? { userId: metadata.userId.toString() } : {})
    };

    log.security(
      this.getEventDescription(type),
      severity,
      `${details.message || type}`,
      logMetadata
    );

    // Keep only last 10000 events in memory
    if (securityEvents.length > 10000) {
      securityEvents.splice(0, securityEvents.length - 10000);
    }
  }

  /**
   * Get security metrics and dashboard data
   */
  getSecurityMetrics(): SecurityMetrics {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const recentEvents = securityEvents.filter(e => e.timestamp.getTime() > last24Hours);

    // Count events by type
    const eventsByType = {} as Record<SecurityEventType, number>;
    const eventsBySeverity = {} as Record<SecuritySeverity, number>;

    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    // Get top risk users and IPs
    const topRiskUsers = Array.from(userRiskScores.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, riskScore]) => ({ userId, riskScore }));

    const topRiskIPs = Array.from(ipRiskScores.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ipAddress, riskScore]) => ({
        ipAddress,
        riskScore,
        eventCount: this.getIPEventCount(ipAddress, last24Hours)
      }));

    // Calculate system health metrics
    const failedLogins = eventsByType['LOGIN_FAILURE'] || 0;
    const totalLogins = (eventsByType['LOGIN_SUCCESS'] || 0) + failedLogins;
    const authenticationFailureRate = totalLogins > 0 ? (failedLogins / totalLogins) * 100 : 0;

    const rateLimitViolations = eventsByType['RATE_LIMIT_EXCEEDED'] || 0;
    const suspiciousEvents = (eventsByType['SUSPICIOUS_ACTIVITY'] || 0) +
                           (eventsByType['SECURITY_VIOLATION'] || 0) +
                           (eventsByType['BRUTE_FORCE_ATTACK'] || 0);

    const suspiciousActivityScore = Math.min((suspiciousEvents / Math.max(recentEvents.length, 1)) * 100, 100);

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      activeThreats: securityAlerts.filter(a => !a.acknowledged && a.severity !== 'low').length,
      topRiskUsers,
      topRiskIPs,
      recentAlerts: securityAlerts.slice(-20).reverse(),
      systemHealth: {
        authenticationFailureRate,
        rateLimitViolations,
        suspiciousActivityScore,
        lastUpdate: new Date()
      }
    };
  }

  /**
   * Get security events with filtering
   */
  getSecurityEvents(filters: {
    type?: SecurityEventType;
    severity?: SecuritySeverity;
    userId?: number;
    ipAddress?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {}): SecurityEvent[] {
    let filtered = [...securityEvents];

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }

    if (filters.userId) {
      filtered = filtered.filter(e => e.userId === filters.userId);
    }

    if (filters.ipAddress) {
      filtered = filtered.filter(e => e.ipAddress === filters.ipAddress);
    }

    if (filters.startTime) {
      filtered = filtered.filter(e => e.timestamp >= filters.startTime!);
    }

    if (filters.endTime) {
      filtered = filtered.filter(e => e.timestamp <= filters.endTime!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Create a security alert
   */
  createAlert(
    type: string,
    severity: SecuritySeverity,
    message: string,
    details: Record<string, any> = {},
    userId?: number,
    ipAddress?: string
  ): void {
    // Check for existing similar alert
    const existingAlert = securityAlerts.find(
      a => a.type === type && a.userId === userId && a.ipAddress === ipAddress && !a.acknowledged
    );

    if (existingAlert) {
      // Update existing alert
      existingAlert.count++;
      existingAlert.lastSeen = new Date();
      existingAlert.details = { ...existingAlert.details, ...details };
    } else {
      // Create new alert
      const alert: SecurityAlert = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type,
        severity,
        message,
        userId,
        ipAddress,
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        acknowledged: false,
        details
      };

      securityAlerts.push(alert);

      // Keep only last 1000 alerts
      if (securityAlerts.length > 1000) {
        securityAlerts.splice(0, securityAlerts.length - 1000);
      }
    }

    // Log critical alerts immediately
    if (severity === 'critical') {
      log.security(`CRITICAL ALERT: ${type}`, 'critical', message, {
        alertType: type,
        userId: userId ? userId.toString() : undefined,
        ipAddress,
        ...details
      });
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = securityAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Analyze user behavior for anomalies
   */
  analyzeUserBehavior(userId: number): {
    riskScore: number;
    anomalies: string[];
    recommendations: string[];
  } {
    const userEvents = securityEvents.filter(e => e.userId === userId);
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentEvents = userEvents.filter(e => e.timestamp.getTime() > last24Hours);

    const anomalies: string[] = [];
    const recommendations: string[] = [];
    let riskScore = userRiskScores.get(userId) || 0;

    // Check for unusual login patterns
    const loginEvents = recentEvents.filter(e => e.type === 'LOGIN_SUCCESS');
    const uniqueIPs = new Set(loginEvents.map(e => e.ipAddress)).size;

    if (uniqueIPs > 3) {
      anomalies.push('Multiple IP addresses used for login');
      recommendations.push('Consider enabling IP binding');
    }

    // Check for failed login attempts
    const failedLogins = recentEvents.filter(e => e.type === 'LOGIN_FAILURE').length;
    if (failedLogins > 5) {
      anomalies.push('Multiple failed login attempts');
      recommendations.push('Consider account security review');
    }

    // Check session patterns
    const sessions = sessionManager.getUserSessions(userId);
    if (sessions.length > 5) {
      anomalies.push('Many active sessions');
      recommendations.push('Review active sessions and logout unused ones');
    }

    return {
      riskScore,
      anomalies,
      recommendations
    };
  }

  /**
   * Generate security report
   */
  generateSecurityReport(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): {
    summary: {
      totalEvents: number;
      criticalAlerts: number;
      averageRiskScore: number;
      timeRange: string;
    };
    topThreats: Array<{
      type: string;
      count: number;
      severity: SecuritySeverity;
    }>;
    riskAnalysis: {
      highRiskUsers: number;
      suspiciousIPs: number;
      compromisedSessions: number;
    };
    recommendations: string[];
  } {
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[timeRange];

    const cutoff = Date.now() - timeRangeMs;
    const relevantEvents = securityEvents.filter(e => e.timestamp.getTime() > cutoff);

    // Count threat types
    const threatCounts = new Map<string, { count: number; severity: SecuritySeverity }>();
    relevantEvents.forEach(event => {
      const key = event.type;
      const existing = threatCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        threatCounts.set(key, { count: 1, severity: event.severity });
      }
    });

    const topThreats = Array.from(threatCounts.entries())
      .map(([type, data]) => ({ type, count: data.count, severity: data.severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Risk analysis
    const highRiskUsers = Array.from(userRiskScores.values()).filter(score => score > 70).length;
    const suspiciousIPs = Array.from(ipRiskScores.values()).filter(score => score > 60).length;
    const compromisedSessions = sessionManager.getSessionStats().highRiskSessions;

    // Generate recommendations
    const recommendations: string[] = [];
    if (relevantEvents.filter(e => e.type === 'LOGIN_FAILURE').length > 50) {
      recommendations.push('Consider implementing additional authentication factors');
    }
    if (suspiciousIPs > 5) {
      recommendations.push('Review and potentially block suspicious IP addresses');
    }
    if (highRiskUsers > 10) {
      recommendations.push('Conduct security review for high-risk users');
    }

    const criticalAlerts = securityAlerts.filter(
      a => a.severity === 'critical' && a.timestamp.getTime() > cutoff
    ).length;

    const allRiskScores = [...userRiskScores.values(), ...ipRiskScores.values()];
    const averageRiskScore = allRiskScores.length > 0
      ? allRiskScores.reduce((a, b) => a + b, 0) / allRiskScores.length
      : 0;

    return {
      summary: {
        totalEvents: relevantEvents.length,
        criticalAlerts,
        averageRiskScore: Math.round(averageRiskScore),
        timeRange
      },
      topThreats,
      riskAnalysis: {
        highRiskUsers,
        suspiciousIPs,
        compromisedSessions
      },
      recommendations
    };
  }

  /**
   * Private helper methods
   */
  private updateRiskScores(event: SecurityEvent): void {
    // Update user risk score
    if (event.userId) {
      const currentScore = userRiskScores.get(event.userId) || 0;
      const increment = this.getRiskIncrement(event.type, event.severity);
      userRiskScores.set(event.userId, Math.min(currentScore + increment, 100));
    }

    // Update IP risk score
    if (event.ipAddress) {
      const currentScore = ipRiskScores.get(event.ipAddress) || 0;
      const increment = this.getRiskIncrement(event.type, event.severity);
      ipRiskScores.set(event.ipAddress, Math.min(currentScore + increment, 100));
    }
  }

  private getRiskIncrement(type: SecurityEventType, severity: SecuritySeverity): number {
    const baseScores = {
      'LOGIN_FAILURE': 5,
      'BRUTE_FORCE_ATTACK': 20,
      'SUSPICIOUS_ACTIVITY': 10,
      'RATE_LIMIT_EXCEEDED': 8,
      'IP_CHANGE': 3,
      'DEVICE_CHANGE': 5,
      'UNAUTHORIZED_ACCESS': 15,
      'SECURITY_VIOLATION': 12
    };

    const severityMultipliers = {
      'low': 1,
      'medium': 1.5,
      'high': 2,
      'critical': 3
    };

    const baseScore = baseScores[type] || 1;
    const multiplier = severityMultipliers[severity];

    return Math.round(baseScore * multiplier);
  }

  private checkAlertConditions(event: SecurityEvent): void {
    const now = Date.now();

    // Check for brute force attacks
    if (event.type === 'LOGIN_FAILURE' && event.ipAddress) {
      const threshold = this.alertThresholds.failedLogins;
      const recentFailures = securityEvents.filter(
        e => e.type === 'LOGIN_FAILURE' &&
             e.ipAddress === event.ipAddress &&
             now - e.timestamp.getTime() < threshold.timeWindow
      ).length;

      if (recentFailures >= threshold.count) {
        this.createAlert(
          'BRUTE_FORCE_ATTACK',
          'high',
          `Brute force attack detected from IP ${event.ipAddress}`,
          { failedAttempts: recentFailures, timeWindow: threshold.timeWindow },
          event.userId,
          event.ipAddress
        );
      }
    }

    // Check for rate limit violations
    if (event.type === 'RATE_LIMIT_EXCEEDED' && event.ipAddress) {
      const threshold = this.alertThresholds.rateLimitViolations;
      const recentViolations = securityEvents.filter(
        e => e.type === 'RATE_LIMIT_EXCEEDED' &&
             e.ipAddress === event.ipAddress &&
             now - e.timestamp.getTime() < threshold.timeWindow
      ).length;

      if (recentViolations >= threshold.count) {
        this.createAlert(
          'API_ABUSE',
          'medium',
          `API abuse detected from IP ${event.ipAddress}`,
          { violations: recentViolations },
          event.userId,
          event.ipAddress
        );
      }
    }
  }

  private getEventDescription(type: SecurityEventType): string {
    const descriptions = {
      'LOGIN_SUCCESS': 'Successful login',
      'LOGIN_FAILURE': 'Failed login attempt',
      'LOGIN_SUSPICIOUS': 'Suspicious login activity',
      'LOGOUT': 'User logout',
      'TOKEN_REFRESH': 'Token refresh',
      'TOKEN_EXPIRED': 'Token expired',
      'TOKEN_BLACKLISTED': 'Blacklisted token used',
      'SESSION_CREATED': 'New session created',
      'SESSION_EXPIRED': 'Session expired',
      'SESSION_INVALIDATED': 'Session invalidated',
      'RATE_LIMIT_EXCEEDED': 'Rate limit exceeded',
      'BRUTE_FORCE_ATTACK': 'Brute force attack detected',
      'IP_CHANGE': 'IP address change',
      'DEVICE_CHANGE': 'Device change detected',
      'PRIVILEGE_ESCALATION': 'Privilege escalation attempt',
      'UNAUTHORIZED_ACCESS': 'Unauthorized access attempt',
      'DATA_ACCESS': 'Data access',
      'SUSPICIOUS_ACTIVITY': 'Suspicious activity',
      'SECURITY_VIOLATION': 'Security violation',
      'ACCOUNT_LOCKOUT': 'Account lockout',
      'PASSWORD_CHANGE': 'Password change',
      'TWO_FACTOR_AUTH': 'Two-factor authentication',
      'API_ABUSE': 'API abuse detected'
    };

    return descriptions[type] || type;
  }

  private getIPEventCount(ipAddress: string, since: number): number {
    return securityEvents.filter(
      e => e.ipAddress === ipAddress && e.timestamp.getTime() > since
    ).length;
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

// Schedule periodic cleanup and analysis
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    // Decay risk scores over time
    const decayRate = 0.95; // 5% decay every hour

    for (const [userId, score] of userRiskScores.entries()) {
      const newScore = score * decayRate;
      if (newScore < 1) {
        userRiskScores.delete(userId);
      } else {
        userRiskScores.set(userId, newScore);
      }
    }

    for (const [ip, score] of ipRiskScores.entries()) {
      const newScore = score * decayRate;
      if (newScore < 1) {
        ipRiskScores.delete(ip);
      } else {
        ipRiskScores.set(ip, newScore);
      }
    }
  }, 60 * 60 * 1000); // Run every hour
}