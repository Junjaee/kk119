/**
 * Database Configuration Service
 * Following Single Responsibility Principle - only handles database configuration decisions
 */

import { IDatabaseConfig } from './interfaces';
import { STORAGE_KEYS } from './constants';

export type DatabaseMode = 'localStorage' | 'supabase' | 'auto';

/**
 * Service for managing database configuration and selection logic
 * Following Single Responsibility Principle
 */
export class DatabaseConfigService implements IDatabaseConfig {
  private mode: DatabaseMode = 'auto';
  private forceLocalStorage = false;

  /**
   * Set database mode
   */
  setMode(mode: DatabaseMode): void {
    this.mode = mode;
  }

  /**
   * Force localStorage usage (for migration and backup purposes)
   */
  setForceLocalStorage(force: boolean): void {
    this.forceLocalStorage = force;
  }

  /**
   * Determine whether to use Supabase
   * Following Open/Closed Principle - easy to extend with new conditions
   */
  shouldUseSupabase(): boolean {
    if (this.forceLocalStorage) return false;
    if (this.mode === 'localStorage') return false;
    if (this.mode === 'supabase') return true;

    // Auto mode: Check Supabase availability
    if (typeof window !== 'undefined') {
      return this.isMigrationCompleted();
    }

    // Server side defaults to Supabase
    return true;
  }

  /**
   * Check if migration has been completed
   */
  isMigrationCompleted(): boolean {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETED) === 'true';
    }
    return false;
  }

  /**
   * Mark migration as completed
   */
  markMigrationCompleted(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETED, 'true');
    }
  }

  /**
   * Reset migration status (for development/testing)
   */
  resetMigrationStatus(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.MIGRATION_COMPLETED);
    }
  }

  /**
   * Get current database mode
   */
  getCurrentMode(): 'localStorage' | 'supabase' {
    return this.shouldUseSupabase() ? 'supabase' : 'localStorage';
  }

  /**
   * Get configuration summary
   */
  getConfigSummary(): {
    mode: DatabaseMode;
    forceLocalStorage: boolean;
    shouldUseSupabase: boolean;
    migrationCompleted: boolean;
  } {
    return {
      mode: this.mode,
      forceLocalStorage: this.forceLocalStorage,
      shouldUseSupabase: this.shouldUseSupabase(),
      migrationCompleted: this.isMigrationCompleted()
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(): boolean {
    // Add validation logic if needed
    return true;
  }
}

// Singleton instance
export const databaseConfigService = new DatabaseConfigService();