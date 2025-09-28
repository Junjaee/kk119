import { UserRole } from '../types/index';
import {
  PUBLIC_PATHS,
  PROTECTED_PATHS,
  LEGACY_ADMIN_PATHS,
  ROLE_PATHS,
  ROLE_HIERARCHY
} from './constants';

export interface PathClassification {
  isPublic: boolean;
  isProtected: boolean;
  isAdminPath: boolean;
  requiresAuth: boolean;
  requiredRole?: UserRole;
}

export interface AccessControlResult {
  hasAccess: boolean;
  requiredRole?: UserRole;
  reason?: string;
}

export class PathClassificationService {
  /**
   * Classify a given pathname
   * Following Single Responsibility Principle
   */
  public classifyPath(pathname: string): PathClassification {
    const isPublic = this.isPublicPath(pathname);
    const isProtected = this.isProtectedPath(pathname);
    const isAdminPath = this.isAdminPath(pathname);
    const requiresAuth = isProtected || isAdminPath;

    return {
      isPublic,
      isProtected,
      isAdminPath,
      requiresAuth,
      requiredRole: this.getRequiredRole(pathname)
    };
  }

  /**
   * Check if path is public (doesn't require authentication)
   */
  private isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(path =>
      pathname === path || pathname.startsWith(`${path}/`)
    );
  }

  /**
   * Check if path is protected (requires authentication)
   */
  private isProtectedPath(pathname: string): boolean {
    return PROTECTED_PATHS.some(path =>
      pathname === path || pathname.startsWith(`${path}/`)
    );
  }

  /**
   * Check if path is admin-only
   */
  private isAdminPath(pathname: string): boolean {
    return LEGACY_ADMIN_PATHS.some(path =>
      pathname === path || pathname.startsWith(`${path}/`)
    );
  }

  /**
   * Determine required role for a given path
   * Following Open/Closed Principle - easy to extend for new roles
   */
  private getRequiredRole(pathname: string): UserRole | undefined {
    // Check in order of hierarchy (most restrictive first)
    const roleOrder: UserRole[] = ['super_admin', 'admin', 'lawyer', 'teacher'];

    for (const role of roleOrder) {
      const rolePaths = ROLE_PATHS[role];
      if (rolePaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
        return role;
      }
    }

    // Check legacy admin paths
    if (this.isAdminPath(pathname)) {
      return 'admin';
    }

    return undefined;
  }

  /**
   * Check if user has access to a specific path
   * Following Single Responsibility Principle
   */
  public checkAccess(userRole: UserRole, pathname: string): AccessControlResult {
    const requiredRole = this.getRequiredRole(pathname);

    // If no specific role required, allow access
    if (!requiredRole) {
      return { hasAccess: true };
    }

    // Check role hierarchy
    const hasAccess = this.hasRoleAccess(userRole, requiredRole);

    return {
      hasAccess,
      requiredRole,
      reason: hasAccess
        ? undefined
        : `User role '${userRole}' insufficient for path requiring '${requiredRole}'`
    };
  }

  /**
   * Check role hierarchy access
   * Following DRY principle - centralized role hierarchy logic
   */
  private hasRoleAccess(userRole: UserRole, requiredRole: UserRole): boolean {
    // Super admin can access everything
    if (userRole === 'super_admin') {
      return true;
    }

    // Exact role match for super_admin paths
    if (requiredRole === 'super_admin') {
      return userRole === 'super_admin';
    }

    // Use hierarchy for other roles
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
  }

  /**
   * Check if path is an authentication page
   */
  public isAuthPage(pathname: string): boolean {
    return pathname === '/login' || pathname === '/signup';
  }

  /**
   * Check if path is root
   */
  public isRootPath(pathname: string): boolean {
    return pathname === '/';
  }

  /**
   * Check if path is admin root
   */
  public isAdminRoot(pathname: string): boolean {
    return pathname === '/admin';
  }
}