import { UserRole } from '../types/index';

// Authentication related constants
export const AUTH_CONSTANTS = {
  BEARER_PREFIX: 'Bearer ',
  BEARER_PREFIX_LENGTH: 7,
  COOKIE_NAMES: {
    AUTH_TOKEN: 'auth-token',
    REFRESH_TOKEN: 'refresh-token'
  },
  HEADERS: {
    USER_ID: 'x-user-id',
    USER_ROLE: 'x-user-role',
    USER_EMAIL: 'x-user-email',
    USER_ASSOCIATION: 'x-user-association'
  }
} as const;

// Role hierarchy for access control
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  teacher: 1,
  lawyer: 2,
  admin: 3,
  super_admin: 4
} as const;

// Default redirect paths for each role
export const DEFAULT_ROLE_REDIRECTS: Record<UserRole, string> = {
  teacher: '/reports',
  lawyer: '/lawyer',
  admin: '/admin/dashboard',
  super_admin: '/admin'
} as const;

// Public paths that don't require authentication
export const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health'
] as const;

// Role-based path configurations
export const ROLE_PATHS: Record<UserRole, readonly string[]> = {
  super_admin: [
    '/super-admin',
    '/admin/associations',
    '/admin/users/manage'
  ],
  admin: [
    '/admin',
    '/admin/members',
    '/admin/reports'
  ],
  lawyer: [],
  teacher: [
    '/reports/new',
    '/community/new'
  ]
} as const;

// Legacy admin paths (backward compatibility)
export const LEGACY_ADMIN_PATHS = [
  '/admin'
] as const;

// Protected paths that require authentication
export const PROTECTED_PATHS = [
  '/reports',
  '/community/new'
] as const;

// Special path handling
export const SPECIAL_PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  LAWYER: '/lawyer'
} as const;