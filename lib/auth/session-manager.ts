import { NextRequest } from 'next/server';
import { sessionDb, userDb } from '@/lib/db/database';
import { enhancedAuth, EnhancedJWTPayload } from './enhanced-auth';
import { log } from '@/lib/utils/logger';
import crypto from 'crypto';

export interface SessionInfo {
  id: string;
  userId: number;
  userEmail: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  location?: string;
  riskScore: number;
}

export interface ActiveSession {
  sessionId: string;
  userId: number;
  deviceInfo: {
    deviceId: string;
    userAgent: string;
    platform: string;
    browser: string;
  };
  ipAddress: string;
  location?: string;
  createdAt: Date;
  lastActivity: Date;
  accessTokens: string[];
  refreshTokens: string[];
  riskScore: number;
  flags: string[];
}

// In-memory session tracking (should be moved to Redis in production)
const activeSessions = new Map<string, ActiveSession>();
const tokenToSession = new Map<string, string>();
const userSessions = new Map<number, Set<string>>();

// Token blacklist (should be moved to Redis in production)
const blacklistedTokens = new Set<string>();
const blacklistedJTIs = new Set<string>();

export class SessionManager {
  /**
   * Create a new session
   */
  createSession(
    userId: number,
    userEmail: string,
    request: NextRequest,
    accessToken: string,
    refreshToken: string
  ): string {
    const sessionId = crypto.randomUUID();
    const deviceId = enhancedAuth.generateDeviceFingerprint(
      request.headers.get('user-agent') || undefined,
      request.headers.get('accept-language') || undefined,
      request.headers.get('accept-encoding') || undefined
    );

    const ipAddress = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const deviceInfo = this.parseUserAgent(userAgent);

    const session: ActiveSession = {
      sessionId,
      userId,
      deviceInfo: {
        deviceId,
        userAgent,
        platform: deviceInfo.platform,
        browser: deviceInfo.browser
      },
      ipAddress,
      createdAt: new Date(),
      lastActivity: new Date(),
      accessTokens: [this.getTokenHash(accessToken)],
      refreshTokens: [this.getTokenHash(refreshToken)],
      riskScore: this.calculateInitialRiskScore(request),
      flags: []
    };

    // Store session
    activeSessions.set(sessionId, session);

    // Map tokens to session
    tokenToSession.set(this.getTokenHash(accessToken), sessionId);
    tokenToSession.set(this.getTokenHash(refreshToken), sessionId);

    // Track user sessions
    if (!userSessions.has(userId)) {
      userSessions.set(userId, new Set());
    }
    userSessions.get(userId)!.add(sessionId);

    log.security('Session Created', 'low', `User: ${userEmail}`, {
      sessionId,
      userId,
      userEmail,
      deviceId,
      ipAddress,
      riskScore: session.riskScore
    });

    return sessionId;
  }

  /**
   * Update session with new tokens (during refresh)
   */
  updateSessionTokens(
    sessionId: string,
    newAccessToken: string,
    newRefreshToken: string,
    oldRefreshToken?: string
  ): void {
    const session = activeSessions.get(sessionId);
    if (!session) {
      log.security('Session Update Failed - Session Not Found', 'medium', `Session: ${sessionId}`);
      return;
    }

    // Remove old refresh token from tracking
    if (oldRefreshToken) {
      const oldHash = this.getTokenHash(oldRefreshToken);
      tokenToSession.delete(oldHash);
      const refreshIndex = session.refreshTokens.indexOf(oldHash);
      if (refreshIndex > -1) {
        session.refreshTokens.splice(refreshIndex, 1);
      }
    }

    // Add new tokens
    const newAccessHash = this.getTokenHash(newAccessToken);
    const newRefreshHash = this.getTokenHash(newRefreshToken);

    session.accessTokens.push(newAccessHash);
    session.refreshTokens.push(newRefreshHash);
    session.lastActivity = new Date();

    // Map new tokens to session
    tokenToSession.set(newAccessHash, sessionId);
    tokenToSession.set(newRefreshHash, sessionId);

    // Clean up old access tokens (keep only last 3)
    if (session.accessTokens.length > 3) {
      const removedTokens = session.accessTokens.splice(0, session.accessTokens.length - 3);
      removedTokens.forEach(tokenHash => {
        tokenToSession.delete(tokenHash);
      });
    }

    log.security('Session Tokens Updated', 'low', `Session: ${sessionId}`, {
      sessionId,
      userId: session.userId,
      accessTokenCount: session.accessTokens.length,
      refreshTokenCount: session.refreshTokens.length
    });
  }

  /**
   * Invalidate a specific session
   */
  invalidateSession(sessionId: string, reason: string = 'Manual logout'): boolean {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Blacklist all tokens in this session
    [...session.accessTokens, ...session.refreshTokens].forEach(tokenHash => {
      // Note: We're storing hashes, but for blacklisting we need the actual tokens
      // In a real implementation, you'd need to map back to actual tokens or store JTIs
      tokenToSession.delete(tokenHash);
    });

    // Remove from user sessions
    const userSessionSet = userSessions.get(session.userId);
    if (userSessionSet) {
      userSessionSet.delete(sessionId);
      if (userSessionSet.size === 0) {
        userSessions.delete(session.userId);
      }
    }

    // Remove session
    activeSessions.delete(sessionId);

    log.security('Session Invalidated', 'medium', `Reason: ${reason}`, {
      sessionId,
      userId: session.userId,
      reason,
      duration: Date.now() - session.createdAt.getTime()
    });

    return true;
  }

  /**
   * Invalidate all sessions for a user
   */
  invalidateAllUserSessions(userId: number, reason: string = 'All sessions logout'): number {
    const userSessionSet = userSessions.get(userId);
    if (!userSessionSet) {
      return 0;
    }

    const sessionIds = Array.from(userSessionSet);
    let invalidatedCount = 0;

    sessionIds.forEach(sessionId => {
      if (this.invalidateSession(sessionId, reason)) {
        invalidatedCount++;
      }
    });

    // Also clear from database
    try {
      sessionDb.deleteByUserId(userId);
    } catch (error) {
      log.error('Failed to clear user sessions from database', error as Error, { userId });
    }

    log.security('All User Sessions Invalidated', 'medium', `User: ${userId}`, {
      userId,
      invalidatedCount,
      reason
    });

    return invalidatedCount;
  }

  /**
   * Get session by token
   */
  getSessionByToken(token: string): ActiveSession | null {
    const tokenHash = this.getTokenHash(token);
    const sessionId = tokenToSession.get(tokenHash);

    if (!sessionId) {
      return null;
    }

    return activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: number): SessionInfo[] {
    const userSessionSet = userSessions.get(userId);
    if (!userSessionSet) {
      return [];
    }

    return Array.from(userSessionSet)
      .map(sessionId => activeSessions.get(sessionId))
      .filter(session => session !== undefined)
      .map(session => ({
        id: session!.sessionId,
        userId: session!.userId,
        userEmail: '', // Would need to fetch from DB or include in session
        deviceId: session!.deviceInfo.deviceId,
        ipAddress: session!.ipAddress,
        userAgent: session!.deviceInfo.userAgent,
        createdAt: session!.createdAt,
        lastActivity: session!.lastActivity,
        isActive: true,
        location: session!.location,
        riskScore: session!.riskScore
      }));
  }

  /**
   * Check if token is blacklisted
   */
  isTokenBlacklisted(token: string): boolean {
    const tokenHash = this.getTokenHash(token);
    return blacklistedTokens.has(tokenHash);
  }

  /**
   * Check if JTI is blacklisted
   */
  isJTIBlacklisted(jti: string): boolean {
    return blacklistedJTIs.has(jti);
  }

  /**
   * Blacklist a token
   */
  blacklistToken(token: string, jti?: string): void {
    const tokenHash = this.getTokenHash(token);
    blacklistedTokens.add(tokenHash);

    if (jti) {
      blacklistedJTIs.add(jti);
    }

    // Remove from session tracking
    const sessionId = tokenToSession.get(tokenHash);
    if (sessionId) {
      const session = activeSessions.get(sessionId);
      if (session) {
        // Remove token from session
        const accessIndex = session.accessTokens.indexOf(tokenHash);
        if (accessIndex > -1) {
          session.accessTokens.splice(accessIndex, 1);
        }

        const refreshIndex = session.refreshTokens.indexOf(tokenHash);
        if (refreshIndex > -1) {
          session.refreshTokens.splice(refreshIndex, 1);
        }

        // If no tokens left, invalidate session
        if (session.accessTokens.length === 0 && session.refreshTokens.length === 0) {
          this.invalidateSession(sessionId, 'All tokens blacklisted');
        }
      }

      tokenToSession.delete(tokenHash);
    }

    log.security('Token Blacklisted', 'medium', `Token: ${tokenHash.substring(0, 8)}...`, {
      tokenHash: tokenHash.substring(0, 16),
      jti,
      sessionId
    });
  }

  /**
   * Update session activity
   */
  updateSessionActivity(sessionId: string, request: NextRequest): void {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return;
    }

    const currentIP = this.getClientIP(request);
    session.lastActivity = new Date();

    // Check for IP change
    if (session.ipAddress !== currentIP) {
      session.flags.push('IP_CHANGE');
      session.riskScore += 20;

      log.security('Session IP Change Detected', 'high', `Session: ${sessionId}`, {
        sessionId,
        userId: session.userId,
        oldIP: session.ipAddress,
        newIP: currentIP
      });
    }

    // Update risk score based on activity patterns
    this.updateRiskScore(session, request);
  }

  /**
   * Clean up expired sessions and blacklisted tokens
   */
  cleanup(): void {
    const now = Date.now();
    const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const maxBlacklistAge = 24 * 60 * 60 * 1000; // 24 hours

    let expiredSessions = 0;
    let cleanedTokens = 0;

    // Clean up expired sessions
    for (const [sessionId, session] of activeSessions.entries()) {
      if (now - session.createdAt.getTime() > maxSessionAge) {
        this.invalidateSession(sessionId, 'Session expired');
        expiredSessions++;
      }
    }

    // Clean up old blacklisted tokens (basic implementation)
    // In production, you'd want more sophisticated cleanup based on actual expiry times
    if (blacklistedTokens.size > 10000) {
      const tokensToRemove = Array.from(blacklistedTokens).slice(0, 1000);
      tokensToRemove.forEach(token => {
        blacklistedTokens.delete(token);
        cleanedTokens++;
      });
    }

    if (expiredSessions > 0 || cleanedTokens > 0) {
      log.debug('Session cleanup completed', {
        expiredSessions,
        cleanedTokens,
        activeSessionsCount: activeSessions.size,
        blacklistedTokensCount: blacklistedTokens.size
      });
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalActiveSessions: number;
    totalActiveUsers: number;
    blacklistedTokensCount: number;
    averageRiskScore: number;
    highRiskSessions: number;
  } {
    const sessions = Array.from(activeSessions.values());
    const riskScores = sessions.map(s => s.riskScore);
    const averageRiskScore = riskScores.length > 0
      ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
      : 0;

    return {
      totalActiveSessions: activeSessions.size,
      totalActiveUsers: userSessions.size,
      blacklistedTokensCount: blacklistedTokens.size,
      averageRiskScore: Math.round(averageRiskScore),
      highRiskSessions: sessions.filter(s => s.riskScore > 70).length
    };
  }

  /**
   * Private helper methods
   */
  private getTokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           request.ip || 'unknown';
  }

  private parseUserAgent(userAgent: string): { platform: string; browser: string } {
    // Basic user agent parsing
    let platform = 'Unknown';
    let browser = 'Unknown';

    if (userAgent.includes('Windows')) platform = 'Windows';
    else if (userAgent.includes('Mac')) platform = 'macOS';
    else if (userAgent.includes('Linux')) platform = 'Linux';
    else if (userAgent.includes('Android')) platform = 'Android';
    else if (userAgent.includes('iOS')) platform = 'iOS';

    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    return { platform, browser };
  }

  private calculateInitialRiskScore(request: NextRequest): number {
    let score = 0;

    // Base score
    score += 10;

    // Check user agent
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || userAgent.length < 10) {
      score += 30; // Suspicious user agent
    }

    // Check for common bot patterns
    if (userAgent && /bot|crawler|spider/i.test(userAgent)) {
      score += 40;
    }

    // Check IP (basic implementation)
    const ip = this.getClientIP(request);
    if (ip === 'unknown') {
      score += 20;
    }

    return Math.min(score, 100);
  }

  private updateRiskScore(session: ActiveSession, request: NextRequest): void {
    // Implement risk scoring logic based on behavior patterns
    // This is a simplified implementation

    const timeSinceLastActivity = Date.now() - session.lastActivity.getTime();

    // Rapid requests might indicate automated behavior
    if (timeSinceLastActivity < 1000) { // Less than 1 second
      session.riskScore += 5;
    }

    // Cap risk score
    session.riskScore = Math.min(session.riskScore, 100);
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Schedule cleanup every 15 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    sessionManager.cleanup();
  }, 15 * 60 * 1000);
}