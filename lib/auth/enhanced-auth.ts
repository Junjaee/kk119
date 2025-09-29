import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import { log } from '@/lib/utils/logger';
import { UserRole, User } from '../types/index';

// Enhanced JWT Configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'change-this-access-secret-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret-in-production';
const JWT_ISSUER = process.env.JWT_ISSUER || 'kyokwon119.app';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'kyokwon119.users';

// Token Lifetimes
const ACCESS_TOKEN_LIFETIME = process.env.ACCESS_TOKEN_LIFETIME || '30m'; // 30 minutes
const REFRESH_TOKEN_LIFETIME = process.env.REFRESH_TOKEN_LIFETIME || '7d'; // 7 days

// Convert secrets to Uint8Array for jose
const getAccessSecret = () => new TextEncoder().encode(JWT_ACCESS_SECRET);
const getRefreshSecret = () => new TextEncoder().encode(JWT_REFRESH_SECRET);

// Validate JWT secrets on startup
const validateSecrets = () => {
  if (JWT_ACCESS_SECRET === 'change-this-access-secret-in-production' && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_ACCESS_SECRET must be set in production');
  }
  if (JWT_REFRESH_SECRET === 'change-this-refresh-secret-in-production' && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_REFRESH_SECRET must be set in production');
  }
  if (JWT_ACCESS_SECRET === JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
  }
  if (JWT_ACCESS_SECRET.length < 32) {
    console.warn('⚠️  JWT_ACCESS_SECRET should be at least 32 characters long');
  }
  if (JWT_REFRESH_SECRET.length < 32) {
    console.warn('⚠️  JWT_REFRESH_SECRET should be at least 32 characters long');
  }
};

// Enhanced JWT Payload Interface
export interface EnhancedJWTPayload {
  // User Information
  userId: number;
  email: string;
  name: string;
  role: UserRole;
  association_id?: number;

  // Security Claims
  jti: string;           // JWT ID for blacklisting
  iss: string;           // Issuer
  aud: string;           // Audience
  iat: number;           // Issued At
  exp: number;           // Expires At
  nbf: number;           // Not Before

  // Enhanced Security
  deviceId?: string;     // Device fingerprint
  ipAddress?: string;    // IP address when token was issued
  sessionId: string;     // Session identifier
  tokenType: 'access' | 'refresh';

  // Legacy support
  isAdmin?: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface TokenVerificationResult {
  valid: boolean;
  payload?: EnhancedJWTPayload;
  error?: string;
  shouldRefresh?: boolean;
}

// In-memory token blacklist (should be replaced with Redis in production)
const tokenBlacklist = new Set<string>();

export class EnhancedAuth {
  constructor() {
    validateSecrets();
  }

  /**
   * Generate a unique JWT ID
   */
  private generateJTI(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate a secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(24).toString('hex');
  }

  /**
   * Create device fingerprint from request headers
   */
  generateDeviceFingerprint(userAgent?: string, acceptLanguage?: string, acceptEncoding?: string): string {
    const fingerprint = crypto.createHash('sha256')
      .update(userAgent || '')
      .update(acceptLanguage || '')
      .update(acceptEncoding || '')
      .digest('hex');
    return fingerprint.substring(0, 16);
  }

  /**
   * Generate access token
   */
  async generateAccessToken(
    payload: Omit<EnhancedJWTPayload, 'jti' | 'iss' | 'aud' | 'iat' | 'exp' | 'nbf' | 'sessionId' | 'tokenType'>,
    sessionId?: string
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const jti = this.generateJTI();

    const enhancedPayload: EnhancedJWTPayload = {
      ...payload,
      jti,
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      iat: now,
      exp: now + this.parseLifetime(ACCESS_TOKEN_LIFETIME),
      nbf: now - 30, // Allow 30 seconds clock skew
      sessionId: sessionId || this.generateSessionId(),
      tokenType: 'access'
    };

    const token = await new SignJWT(enhancedPayload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(getAccessSecret());

    log.security('JWT Access Token Generated', 'low', `User: ${payload.email}, JTI: ${jti}`, {
      userId: payload.userId,
      jti,
      tokenType: 'access',
      expiresAt: new Date(enhancedPayload.exp * 1000).toISOString()
    });

    return token;
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(
    payload: Omit<EnhancedJWTPayload, 'jti' | 'iss' | 'aud' | 'iat' | 'exp' | 'nbf' | 'sessionId' | 'tokenType'>,
    sessionId?: string
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const jti = this.generateJTI();

    const enhancedPayload: EnhancedJWTPayload = {
      ...payload,
      jti,
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      iat: now,
      exp: now + this.parseLifetime(REFRESH_TOKEN_LIFETIME),
      nbf: now - 30, // Allow 30 seconds clock skew
      sessionId: sessionId || this.generateSessionId(),
      tokenType: 'refresh'
    };

    const token = await new SignJWT(enhancedPayload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(getRefreshSecret());

    log.security('JWT Refresh Token Generated', 'low', `User: ${payload.email}, JTI: ${jti}`, {
      userId: payload.userId,
      jti,
      tokenType: 'refresh',
      expiresAt: new Date(enhancedPayload.exp * 1000).toISOString()
    });

    return token;
  }

  /**
   * Generate token pair (access + refresh)
   */
  async generateTokenPair(
    payload: Omit<EnhancedJWTPayload, 'jti' | 'iss' | 'aud' | 'iat' | 'exp' | 'nbf' | 'sessionId' | 'tokenType'>
  ): Promise<TokenPair> {
    const sessionId = this.generateSessionId();

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload, sessionId),
      this.generateRefreshToken(payload, sessionId)
    ]);

    const accessLifetime = this.parseLifetime(ACCESS_TOKEN_LIFETIME);
    const refreshLifetime = this.parseLifetime(REFRESH_TOKEN_LIFETIME);

    log.security('JWT Token Pair Generated', 'medium', `User: ${payload.email}, Session: ${sessionId}`, {
      userId: payload.userId,
      sessionId,
      accessExpiresIn: accessLifetime,
      refreshExpiresIn: refreshLifetime
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessLifetime,
      refreshExpiresIn: refreshLifetime
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<TokenVerificationResult> {
    try {
      // ENHANCED DEBUG: Log token verification start
      console.log('🔍 [ENHANCED-AUTH] Token verification start:', {
        tokenPreview: token.substring(0, 30) + '...',
        tokenLength: token.length
      });

      // Check if token is blacklisted
      if (this.isTokenBlacklisted(token)) {
        log.security('Blacklisted Token Access Attempt', 'medium', `Token: ${token.substring(0, 20)}...`);
        return { valid: false, error: 'Token has been revoked' };
      }

      const { payload } = await jwtVerify(token, getAccessSecret(), {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      });

      const enhancedPayload = payload as EnhancedJWTPayload;

      // ENHANCED DEBUG: Log parsed JWT payload
      console.log('🔍 [ENHANCED-AUTH] JWT payload parsed:', {
        userId: enhancedPayload.userId,
        email: enhancedPayload.email,
        role: enhancedPayload.role,
        jti: enhancedPayload.jti,
        iat: enhancedPayload.iat,
        exp: enhancedPayload.exp,
        sessionId: enhancedPayload.sessionId
      });

      // Validate token type
      if (enhancedPayload.tokenType !== 'access') {
        log.security('Invalid Token Type', 'medium', `Expected access, got: ${enhancedPayload.tokenType}`);
        return { valid: false, error: 'Invalid token type' };
      }

      // Check if token should be refreshed (expires in less than 5 minutes)
      const shouldRefresh = enhancedPayload.exp - Math.floor(Date.now() / 1000) < 300;

      return {
        valid: true,
        payload: enhancedPayload,
        shouldRefresh
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Token verification failed';

      log.security('JWT Access Token Verification Failed', 'medium', errorMessage, {
        error: errorMessage,
        token: token.substring(0, 20) + '...'
      });

      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<TokenVerificationResult> {
    try {
      // Check if token is blacklisted
      if (this.isTokenBlacklisted(token)) {
        log.security('Blacklisted Refresh Token Access Attempt', 'high', `Token: ${token.substring(0, 20)}...`);
        return { valid: false, error: 'Refresh token has been revoked' };
      }

      const { payload } = await jwtVerify(token, getRefreshSecret(), {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      });

      const enhancedPayload = payload as EnhancedJWTPayload;

      // Validate token type
      if (enhancedPayload.tokenType !== 'refresh') {
        log.security('Invalid Refresh Token Type', 'high', `Expected refresh, got: ${enhancedPayload.tokenType}`);
        return { valid: false, error: 'Invalid token type' };
      }

      return {
        valid: true,
        payload: enhancedPayload
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Refresh token verification failed';

      log.security('JWT Refresh Token Verification Failed', 'medium', errorMessage, {
        error: errorMessage,
        token: token.substring(0, 20) + '...'
      });

      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ success: boolean; tokens?: TokenPair; error?: string }> {
    const verificationResult = await this.verifyRefreshToken(refreshToken);

    if (!verificationResult.valid || !verificationResult.payload) {
      return { success: false, error: verificationResult.error };
    }

    const { payload } = verificationResult;

    // Generate new token pair with same session ID
    const newTokens = await this.generateTokenPair({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      association_id: payload.association_id,
      deviceId: payload.deviceId,
      ipAddress: payload.ipAddress,
      isAdmin: payload.isAdmin
    });

    // Blacklist the old refresh token
    this.blacklistToken(refreshToken);

    log.security('JWT Access Token Refreshed', 'low', `User: ${payload.email}`, {
      userId: payload.userId,
      oldSessionId: payload.sessionId,
      oldJti: payload.jti
    });

    return { success: true, tokens: newTokens };
  }

  /**
   * Blacklist a token (revoke it)
   */
  blacklistToken(token: string): void {
    tokenBlacklist.add(token);
    log.security('JWT Token Blacklisted', 'medium', `Token revoked: ${token.substring(0, 20)}...`);
  }

  /**
   * Check if token is blacklisted
   */
  isTokenBlacklisted(token: string): boolean {
    return tokenBlacklist.has(token);
  }

  /**
   * Invalidate all tokens for a session
   */
  invalidateSession(sessionId: string): void {
    // This is a simplified implementation
    // In production, you'd want to store active sessions and their tokens
    log.security('Session Invalidated', 'medium', `Session: ${sessionId}`, {
      sessionId
    });
  }

  /**
   * Parse lifetime string to seconds
   */
  private parseLifetime(lifetime: string): number {
    const unit = lifetime.slice(-1);
    const value = parseInt(lifetime.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 1800; // 30 minutes default
    }
  }

  /**
   * Extract security headers for device fingerprinting
   */
  extractSecurityHeaders(headers: Headers) {
    return {
      userAgent: headers.get('user-agent') || undefined,
      acceptLanguage: headers.get('accept-language') || undefined,
      acceptEncoding: headers.get('accept-encoding') || undefined,
      xForwardedFor: headers.get('x-forwarded-for') || undefined,
      xRealIp: headers.get('x-real-ip') || undefined
    };
  }

  /**
   * Get client IP address
   */
  getClientIP(headers: Headers): string | undefined {
    return headers.get('x-forwarded-for')?.split(',')[0] ||
           headers.get('x-real-ip') ||
           undefined;
  }

  /**
   * Create enhanced payload from user data
   */
  createPayloadFromUser(user: any, headers?: Headers): Omit<EnhancedJWTPayload, 'jti' | 'iss' | 'aud' | 'iat' | 'exp' | 'nbf' | 'sessionId' | 'tokenType'> {
    const securityHeaders = headers ? this.extractSecurityHeaders(headers) : {};

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'teacher',
      association_id: user.association_id || undefined,
      deviceId: headers ? this.generateDeviceFingerprint(
        securityHeaders.userAgent,
        securityHeaders.acceptLanguage,
        securityHeaders.acceptEncoding
      ) : undefined,
      ipAddress: headers ? this.getClientIP(headers) : undefined,
      isAdmin: user.is_admin === 1
    };
  }
}

// Export singleton instance
export const enhancedAuth = new EnhancedAuth();

// Backward compatibility - will be removed in next phase
export const auth = {
  generateToken: async (payload: any): Promise<string> => {
    console.warn('⚠️  Using deprecated auth.generateToken. Please migrate to enhancedAuth.generateTokenPair');
    const tokens = await enhancedAuth.generateTokenPair(payload);
    return tokens.accessToken;
  },

  verifyToken: async (token: string): Promise<any> => {
    console.warn('⚠️  Using deprecated auth.verifyToken. Please migrate to enhancedAuth.verifyAccessToken');
    const result = await enhancedAuth.verifyAccessToken(token);
    return result.valid ? result.payload : null;
  }
};