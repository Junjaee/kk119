/**
 * ID Generation Service
 * Following Single Responsibility Principle - only handles ID generation
 */

import { randomUUID } from 'crypto';
import { nanoid } from 'nanoid';
import { ID_GENERATION, ID_PREFIXES } from './constants';

export type IdStrategy = 'uuid' | 'nano' | 'custom' | 'teacher';

export interface IdGenerationOptions {
  strategy?: IdStrategy;
  prefix?: string;
  schoolCode?: string;
}

/**
 * Service for generating various types of IDs
 * Following Single Responsibility Principle
 */
export class IdGenerationService {
  /**
   * Generate UUID v4 - most secure and standard
   */
  generateUUID(): string {
    return randomUUID();
  }

  /**
   * Generate NanoID - short and URL safe
   */
  generateNanoId(length: number = ID_GENERATION.NANOID_LENGTH): string {
    return nanoid(length);
  }

  /**
   * Generate custom ID with prefix + timestamp + random
   */
  generateCustomId(prefix: string = ID_PREFIXES.USER): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random()
      .toString(36)
      .substr(ID_GENERATION.RANDOM_SUBSTRING_START, ID_GENERATION.RANDOM_SUFFIX_LENGTH);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Generate teacher-specific ID with school code
   */
  generateTeacherId(schoolCode?: string): string {
    const timestamp = Date.now().toString(36);
    const random = this.generateNanoId(ID_GENERATION.TEACHER_NANOID_LENGTH);
    const school = schoolCode || ID_PREFIXES.UNKNOWN_SCHOOL;
    return `${ID_PREFIXES.TEACHER}_${school}_${timestamp}_${random}`;
  }

  /**
   * Generate report ID
   */
  generateReportId(): string {
    return this.generateCustomId(ID_PREFIXES.REPORT);
  }

  /**
   * Generate post ID
   */
  generatePostId(): string {
    return this.generateCustomId(ID_PREFIXES.POST);
  }

  /**
   * Generate comment ID
   */
  generateCommentId(): string {
    return this.generateCustomId(ID_PREFIXES.COMMENT);
  }

  /**
   * Generate ID based on strategy
   */
  generateId(options: IdGenerationOptions = {}): string {
    const { strategy = 'uuid', prefix, schoolCode } = options;

    switch (strategy) {
      case 'nano':
        return this.generateNanoId();
      case 'custom':
        return this.generateCustomId(prefix);
      case 'teacher':
        return this.generateTeacherId(schoolCode);
      default:
        return this.generateUUID();
    }
  }
}

// Singleton instance
export const idGenerationService = new IdGenerationService();

// Legacy compatibility wrapper
export const generateId = {
  uuid: () => idGenerationService.generateUUID(),
  nano: () => idGenerationService.generateNanoId(),
  custom: (prefix?: string) => idGenerationService.generateCustomId(prefix),
  teacherId: (schoolCode?: string) => idGenerationService.generateTeacherId(schoolCode)
};