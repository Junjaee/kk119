// @CODE:AUTH-001-STORAGE | Chain: SPEC-AUTH-001 -> CODE-AUTH-001-STORAGE
// Role-based storage keys for token isolation

export type UserRole = 'teacher' | 'lawyer' | 'admin';

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
} as const;

// Legacy key for migration
export const LEGACY_KEYS = {
  token: 'token',
  storage: 'kyokwon119-storage',
  rememberedEmail: 'rememberedEmail',
} as const;

// @CODE:AUTH-005-STORAGE-MIGRATE | SPEC-AUTH-005
// 1회성 legacy 이관 유틸: super_admin 스토리지 키를 admin 키로 이관 후 삭제
const SUPER_ADMIN_LEGACY_KEYS = ['token_super_admin', 'storage_super_admin'] as const;

/**
 * Migrate legacy super_admin storage keys to admin.
 * Idempotent: safe to call multiple times. Runs only in browser.
 */
export function migrateLegacyStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const legacy of SUPER_ADMIN_LEGACY_KEYS) {
      const value = localStorage.getItem(legacy);
      if (value) {
        const adminKey = legacy.replace('super_admin', 'admin');
        if (!localStorage.getItem(adminKey)) {
          localStorage.setItem(adminKey, value);
        }
        localStorage.removeItem(legacy);
      }
    }
  } catch {
    // Ignore storage access errors (private mode, quota, etc.)
  }
}
