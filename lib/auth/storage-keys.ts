// @CODE:AUTH-001-STORAGE | Chain: SPEC-AUTH-001 -> CODE-AUTH-001-STORAGE
// Role-based storage keys for token isolation

export type UserRole = 'teacher' | 'lawyer' | 'admin' | 'admin';

export const AUTH_STORAGE_KEYS = {
  teacher: {
    token: 'token_teacher',
    storage: 'storage_teacher',
  },
  lawyer: {
    token: 'token_lawyer',
    storage: 'storage_lawyer',
  },
  admin: {
    token: 'token_admin',
    storage: 'storage_admin',
  },
  super_admin: {
    token: 'token_super_admin',
    storage: 'storage_super_admin',
  },
} as const;

// Legacy key for migration
export const LEGACY_KEYS = {
  token: 'token',
  storage: 'kyokwon119-storage',
  rememberedEmail: 'rememberedEmail',
} as const;
