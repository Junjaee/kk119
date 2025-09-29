import { NextRequest } from 'next/server';
import { enhancedAuth, EnhancedJWTPayload } from './enhanced-auth';
import { log } from '@/lib/utils/logger';
import { userDb } from '@/lib/db/database';

export interface SecurityValidationOptions {
  validateIP?: boolean;           // Validate IP address matches token
  validateDevice?: boolean;       // Validate device fingerprint
  validateUserAgent?: boolean;    // Validate user agent consistency
  maxTokenAge?: number;          // Maximum token age in seconds
  requireFreshToken?: boolean;    // Require token issued within last hour
  validateUserStatus?: boolean;   // Check if user is still active/verified
}

export interface ValidationResult {
  valid: boolean;
  payload?: EnhancedJWTPayload;
  error?: string;
  securityFlags?: string[];
  shouldRefresh?: boolean;
  requireReauth?: boolean;
}

export class SecurityValidator {
  /**
   * Comprehensive security validation for JWT tokens
   */
  async validateTokenSecurity(
    request: NextRequest,
    token: string,
    options: SecurityValidationOptions = {}
  ): Promise<ValidationResult> {
    const securityFlags: string[] = [];
    const requestId = crypto.randomUUID();

    try {
      // First, verify the token using enhanced auth
      const verificationResult = await enhancedAuth.verifyAccessToken(token);

      if (!verificationResult.valid || !verificationResult.payload) {
        return {
          valid: false,
          error: verificationResult.error || 'Invalid token',
          securityFlags: ['INVALID_TOKEN']
        };
      }

      const payload = verificationResult.payload;
      const { shouldRefresh } = verificationResult;

      // Security validation checks
      const validationErrors: string[] = [];

      // 1. IP Address Validation
      if (options.validateIP && payload.ipAddress) {
        const currentIP = this.getClientIP(request);
        if (currentIP && payload.ipAddress !== currentIP) {
          validationErrors.push('IP address mismatch');
          securityFlags.push('IP_MISMATCH');

          log.security('JWT IP Address Mismatch', 'high',
            `Token IP: ${payload.ipAddress}, Current IP: ${currentIP}`, {
            requestId,
            userId: payload.userId,
            tokenIP: payload.ipAddress,
            currentIP,
            jti: payload.jti
          });
        }
      }

      // 2. Device Fingerprint Validation
      if (options.validateDevice && payload.deviceId) {
        const currentDeviceId = enhancedAuth.generateDeviceFingerprint(
          request.headers.get('user-agent') || undefined,
          request.headers.get('accept-language') || undefined,
          request.headers.get('accept-encoding') || undefined
        );

        if (payload.deviceId !== currentDeviceId) {
          validationErrors.push('Device fingerprint mismatch');
          securityFlags.push('DEVICE_MISMATCH');

          log.security('JWT Device Fingerprint Mismatch', 'high',
            `User: ${payload.email}`, {
            requestId,
            userId: payload.userId,
            tokenDevice: payload.deviceId,
            currentDevice: currentDeviceId,
            jti: payload.jti
          });
        }
      }

      // 3. User Agent Validation (basic check)
      if (options.validateUserAgent) {
        const currentUserAgent = request.headers.get('user-agent');
        // This is a simplified check - in production you might want more sophisticated validation
        if (!currentUserAgent) {
          securityFlags.push('MISSING_USER_AGENT');
        }
      }

      // 4. Token Age Validation
      if (options.maxTokenAge) {
        const tokenAge = Math.floor(Date.now() / 1000) - payload.iat;
        if (tokenAge > options.maxTokenAge) {
          validationErrors.push('Token too old');
          securityFlags.push('TOKEN_TOO_OLD');

          log.security('JWT Token Age Exceeded', 'medium',
            `Token age: ${tokenAge}s, Max: ${options.maxTokenAge}s`, {
            requestId,
            userId: payload.userId,
            tokenAge,
            maxAge: options.maxTokenAge,
            jti: payload.jti
          });
        }
      }

      // 5. Fresh Token Requirement
      if (options.requireFreshToken) {
        const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
        if (payload.iat < oneHourAgo) {
          validationErrors.push('Token not fresh enough');
          securityFlags.push('TOKEN_NOT_FRESH');
        }
      }

      // 6. User Status Validation
      if (options.validateUserStatus) {
        try {
          const user = userDb.findById(payload.userId) as any;
          if (!user) {
            validationErrors.push('User not found');
            securityFlags.push('USER_NOT_FOUND');
          } else if (user.is_verified === 0) {
            validationErrors.push('User not verified');
            securityFlags.push('USER_NOT_VERIFIED');
          }
        } catch (dbError) {
          log.error('Failed to validate user status', dbError as Error, {
            requestId,
            userId: payload.userId
          });
          securityFlags.push('USER_STATUS_CHECK_FAILED');
        }
      }

      // 7. Check for token blacklisting
      if (enhancedAuth.isTokenBlacklisted(token)) {
        validationErrors.push('Token has been revoked');
        securityFlags.push('TOKEN_BLACKLISTED');

        log.security('Blacklisted Token Used', 'high',
          `User: ${payload.email}`, {
          requestId,
          userId: payload.userId,
          jti: payload.jti
        });
      }

      // Determine if validation failed
      if (validationErrors.length > 0) {
        return {
          valid: false,
          error: validationErrors[0], // Return first error
          securityFlags,
          requireReauth: securityFlags.some(flag =>
            ['IP_MISMATCH', 'DEVICE_MISMATCH', 'TOKEN_BLACKLISTED'].includes(flag)
          )
        };
      }

      // Log security warnings if any flags were raised
      if (securityFlags.length > 0) {
        log.security('JWT Security Flags Raised', 'medium',
          `Flags: ${securityFlags.join(', ')}`, {
          requestId,
          userId: payload.userId,
          securityFlags,
          jti: payload.jti
        });
      }

      return {
        valid: true,
        payload,
        securityFlags,
        shouldRefresh,
        requireReauth: false
      };

    } catch (error: any) {
      log.error('Security validation error', error, {
        requestId,
        error: error.message,
        stack: error.stack
      });

      return {
        valid: false,
        error: 'Security validation failed',
        securityFlags: ['VALIDATION_ERROR']
      };
    }
  }

  /**
   * Validate token for API endpoints with specific security requirements
   * ONLY accepts Authorization header tokens - cookies are completely ignored
   */
  async validateAPIToken(
    request: NextRequest,
    securityLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<ValidationResult> {
    // Get token ONLY from Authorization header - cookies are completely ignored
    let token: string | undefined;
    const tokenSource: string = 'authorization_header';

    // ONLY Authorization header is accepted
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    console.log('🔍 [SECURITY-VALIDATOR] Token source (cookies disabled):', {
      tokenSource: token ? tokenSource : 'none',
      hasAuthHeader: !!authHeader,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
      cookiesIgnored: true
    });

    if (!token) {
      return {
        valid: false,
        error: 'No valid Authorization header token provided',
        securityFlags: ['NO_AUTHORIZATION_TOKEN']
      };
    }

    // Define security options based on level
    const securityOptions: SecurityValidationOptions = {
      validateUserStatus: true, // Always validate user status
      ...this.getSecurityOptionsForLevel(securityLevel)
    };

    return this.validateTokenSecurity(request, token, securityOptions);
  }

  /**
   * Get security validation options based on security level
   */
  private getSecurityOptionsForLevel(level: 'low' | 'medium' | 'high' | 'critical'): SecurityValidationOptions {
    switch (level) {
      case 'low':
        return {
          validateIP: false,
          validateDevice: false,
          validateUserAgent: false,
          maxTokenAge: 86400, // 24 hours
          requireFreshToken: false
        };

      case 'medium':
        return {
          validateIP: false,
          validateDevice: true,
          validateUserAgent: true,
          maxTokenAge: 43200, // 12 hours
          requireFreshToken: false
        };

      case 'high':
        return {
          validateIP: true,
          validateDevice: true,
          validateUserAgent: true,
          maxTokenAge: 21600, // 6 hours
          requireFreshToken: false
        };

      case 'critical':
        return {
          validateIP: true,
          validateDevice: true,
          validateUserAgent: true,
          maxTokenAge: 3600, // 1 hour
          requireFreshToken: true
        };

      default:
        return {};
    }
  }

  /**
   * Extract client IP address from request
   */
  private getClientIP(request: NextRequest): string | null {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           request.ip ||
           null;
  }

  /**
   * Check if request is from a suspicious source
   */
  async checkSuspiciousActivity(request: NextRequest, payload: EnhancedJWTPayload): Promise<string[]> {
    const suspiciousFlags: string[] = [];

    // Check for unusual user agent
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || userAgent.length < 10) {
      suspiciousFlags.push('SUSPICIOUS_USER_AGENT');
    }

    // Check for rapid requests (basic implementation)
    const now = Date.now();
    const requestKey = `requests:${payload.userId}:${this.getClientIP(request)}`;

    // This would be better implemented with Redis in production
    // For now, this is a placeholder for the concept

    // Check for known bad IPs (placeholder)
    const clientIP = this.getClientIP(request);
    if (clientIP && this.isKnownBadIP(clientIP)) {
      suspiciousFlags.push('KNOWN_BAD_IP');
    }

    return suspiciousFlags;
  }

  /**
   * Check if IP is in known bad list (placeholder implementation)
   */
  private isKnownBadIP(ip: string): boolean {
    // In production, this would check against a real IP reputation database
    const knownBadIPs = ['127.0.0.1']; // Placeholder
    return knownBadIPs.includes(ip);
  }

  /**
   * Generate security report for a token
   */
  async generateSecurityReport(request: NextRequest, token: string): Promise<{
    tokenInfo: any;
    securityFlags: string[];
    recommendations: string[];
  }> {
    const validationResult = await this.validateTokenSecurity(request, token, {
      validateIP: true,
      validateDevice: true,
      validateUserAgent: true,
      validateUserStatus: true,
      maxTokenAge: 86400,
      requireFreshToken: false
    });

    const recommendations: string[] = [];

    if (validationResult.securityFlags?.includes('IP_MISMATCH')) {
      recommendations.push('Consider implementing IP binding for sensitive operations');
    }

    if (validationResult.securityFlags?.includes('DEVICE_MISMATCH')) {
      recommendations.push('User may be using token from different device');
    }

    if (validationResult.shouldRefresh) {
      recommendations.push('Token should be refreshed soon');
    }

    return {
      tokenInfo: validationResult.payload ? {
        userId: validationResult.payload.userId,
        email: validationResult.payload.email,
        role: validationResult.payload.role,
        issuedAt: new Date(validationResult.payload.iat * 1000).toISOString(),
        expiresAt: new Date(validationResult.payload.exp * 1000).toISOString(),
        jti: validationResult.payload.jti
      } : null,
      securityFlags: validationResult.securityFlags || [],
      recommendations
    };
  }
}

// Export singleton instance
export const securityValidator = new SecurityValidator();