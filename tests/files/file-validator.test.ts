// @TEST:FILE-VALIDATOR-001 | Chain: SPEC-FILE-001 -> CODE-FILE-001
// TEST-FILE-VALIDATOR-001: File validation tests (size, MIME type, malicious file detection)

import { describe, it, expect } from 'vitest';
import { FileValidator } from '@/lib/services/file-validator';

describe('File Validator', () => {
  const validator = new FileValidator();

  describe('TEST-FILE-VALIDATOR-001-SIZE: File size validation', () => {
    it('should accept files under 10MB', () => {
      const fileSizeBytes = 5 * 1024 * 1024; // 5MB
      const result = validator.validateFileSize(fileSizeBytes);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept files exactly 10MB', () => {
      const fileSizeBytes = 10 * 1024 * 1024; // 10MB
      const result = validator.validateFileSize(fileSizeBytes);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files over 10MB', () => {
      const fileSizeBytes = 15 * 1024 * 1024; // 15MB
      const result = validator.validateFileSize(fileSizeBytes);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('should reject zero-byte files', () => {
      const fileSizeBytes = 0;
      const result = validator.validateFileSize(fileSizeBytes);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('비어있는');
    });

    it('should reject negative file sizes', () => {
      const fileSizeBytes = -100;
      const result = validator.validateFileSize(fileSizeBytes);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('TEST-FILE-VALIDATOR-001-MIME: MIME type validation', () => {
    it('should accept image/jpeg', () => {
      const result = validator.validateMimeType('image/jpeg', 'test.jpg');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept image/png', () => {
      const result = validator.validateMimeType('image/png', 'test.png');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept image/gif', () => {
      const result = validator.validateMimeType('image/gif', 'test.gif');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept application/pdf', () => {
      const result = validator.validateMimeType('application/pdf', 'test.pdf');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept video/mp4', () => {
      const result = validator.validateMimeType('video/mp4', 'test.mp4');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept video/x-msvideo (AVI)', () => {
      const result = validator.validateMimeType('video/x-msvideo', 'test.avi');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject executable files (.exe)', () => {
      const result = validator.validateMimeType('application/x-msdownload', 'malware.exe');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('허용되지 않는');
    });

    it('should reject script files (.js)', () => {
      const result = validator.validateMimeType('application/javascript', 'script.js');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('허용되지 않는');
    });

    it('should reject when MIME type does not match extension', () => {
      const result = validator.validateMimeType('image/jpeg', 'test.pdf');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('일치하지');
    });

    it('should reject when extension does not match MIME type', () => {
      const result = validator.validateMimeType('application/pdf', 'test.jpg');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('일치하지');
    });
  });

  describe('TEST-FILE-VALIDATOR-001-EXTENSION: File extension validation', () => {
    it('should accept .jpg extension', () => {
      const result = validator.validateExtension('test.jpg');

      expect(result.isValid).toBe(true);
    });

    it('should accept .jpeg extension', () => {
      const result = validator.validateExtension('test.jpeg');

      expect(result.isValid).toBe(true);
    });

    it('should accept .png extension', () => {
      const result = validator.validateExtension('test.png');

      expect(result.isValid).toBe(true);
    });

    it('should accept .gif extension', () => {
      const result = validator.validateExtension('test.gif');

      expect(result.isValid).toBe(true);
    });

    it('should accept .pdf extension', () => {
      const result = validator.validateExtension('test.pdf');

      expect(result.isValid).toBe(true);
    });

    it('should accept .mp4 extension', () => {
      const result = validator.validateExtension('test.mp4');

      expect(result.isValid).toBe(true);
    });

    it('should accept .avi extension', () => {
      const result = validator.validateExtension('test.avi');

      expect(result.isValid).toBe(true);
    });

    it('should reject .exe extension', () => {
      const result = validator.validateExtension('malware.exe');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('허용되지 않는');
    });

    it('should reject .zip extension', () => {
      const result = validator.validateExtension('archive.zip');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('허용되지 않는');
    });

    it('should handle case-insensitive extensions', () => {
      const resultUpper = validator.validateExtension('test.JPG');
      const resultMixed = validator.validateExtension('test.JpG');

      expect(resultUpper.isValid).toBe(true);
      expect(resultMixed.isValid).toBe(true);
    });
  });

  describe('TEST-FILE-VALIDATOR-001-MALICIOUS: Malicious file detection', () => {
    it('should detect double extension files', () => {
      const result = validator.validateExtension('innocent.pdf.exe');

      expect(result.isValid).toBe(false);
    });

    it('should detect null byte injection', () => {
      const result = validator.validateExtension('file.pdf\0.exe');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('악성');
    });

    it('should detect path traversal attempts', () => {
      const result = validator.validateFilename('../../etc/passwd');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('경로');
    });

    it('should detect absolute path attempts', () => {
      const result = validator.validateFilename('/etc/passwd');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('경로');
    });

    it('should accept normal filenames with Korean characters', () => {
      const result = validator.validateFilename('증거사진_2025.jpg');

      expect(result.isValid).toBe(true);
    });

    it('should reject filenames with special characters', () => {
      const result = validator.validateFilename('file|name<>.jpg');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('특수문자');
    });

    it('should reject extremely long filenames', () => {
      const longName = 'a'.repeat(256) + '.jpg';
      const result = validator.validateFilename(longName);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('255');
    });
  });

  describe('TEST-FILE-VALIDATOR-001-COMPLETE: Complete file validation', () => {
    it('should validate complete file object (happy path)', () => {
      const file = {
        name: '증거사진.jpg',
        size: 2 * 1024 * 1024, // 2MB
        type: 'image/jpeg'
      };

      const result = validator.validateFile(file);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file with all invalid properties', () => {
      const file = {
        name: 'malware.exe',
        size: 15 * 1024 * 1024, // 15MB
        type: 'application/x-msdownload'
      };

      const result = validator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide detailed error messages', () => {
      const file = {
        name: 'test.pdf',
        size: 0,
        type: 'application/pdf'
      };

      const result = validator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('비어있는');
    });
  });
});
