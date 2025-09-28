/**
 * User Context Service
 * Following Single Responsibility Principle - only handles user context extraction
 */

import { IUserContext } from './interfaces';
import { STORAGE_KEYS, ERROR_MESSAGES } from './constants';

/**
 * Service for extracting current user context
 * Following Single Responsibility Principle
 */
export class UserContextService implements IUserContext {
  /**
   * Get current user ID from storage
   */
  getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;

    try {
      const authData = localStorage.getItem(STORAGE_KEYS.AUTH_STORAGE);
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.user?.id;
      }
    } catch (error) {
      console.error(ERROR_MESSAGES.FAILED_TO_GET_CURRENT_USER, error);
    }

    return undefined;
  }

  /**
   * Get current association ID from storage
   * TODO: Implement association tracking
   */
  getAssociationId(): string | undefined {
    // Future implementation for association tracking
    return undefined;
  }

  /**
   * Get complete user context
   */
  getUserContext(): { userId?: string; associationId?: string } {
    return {
      userId: this.getUserId(),
      associationId: this.getAssociationId()
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getUserId();
  }

  /**
   * Validate user context for operations that require authentication
   */
  validateUserContext(): { userId: string; associationId?: string } {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User authentication required');
    }
    return {
      userId,
      associationId: this.getAssociationId()
    };
  }
}

// Singleton instance
export const userContextService = new UserContextService();