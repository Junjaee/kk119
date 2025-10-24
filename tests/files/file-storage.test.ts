// @TEST:FILE-STORAGE-001 | Chain: SPEC-FILE-001 -> CODE-FILE-001
// TEST-FILE-STORAGE-001: File storage tests (UUID naming, directory structure, version control)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileStorage } from '@/lib/services/file-storage';
import path from 'path';
import fs from 'fs';

describe('File Storage', () => {
  let storage: FileStorage;
  const testUploadDir = path.join(process.cwd(), 'data', 'test-uploads');

  beforeEach(() => {
    storage = new FileStorage(testUploadDir);
    // Ensure test upload directory exists
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testUploadDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
  });

  describe('TEST-FILE-STORAGE-001-UUID: UUID filename generation', () => {
    it('should generate UUID-based filename', () => {
      const originalName = '증거사진.jpg';
      const filename = storage.generateUniqueFilename(originalName);

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$/i;
      expect(filename).toMatch(uuidRegex);
    });

    it('should preserve file extension', () => {
      const testCases = [
        { original: 'test.jpg', ext: '.jpg' },
        { original: 'test.png', ext: '.png' },
        { original: 'test.pdf', ext: '.pdf' },
        { original: 'test.mp4', ext: '.mp4' },
      ];

      testCases.forEach(({ original, ext }) => {
        const filename = storage.generateUniqueFilename(original);
        expect(filename).toMatch(new RegExp(`${ext.replace('.', '\\.')}$`));
      });
    });

    it('should generate unique filenames for same input', () => {
      const filename1 = storage.generateUniqueFilename('test.jpg');
      const filename2 = storage.generateUniqueFilename('test.jpg');

      expect(filename1).not.toBe(filename2);
    });

    it('should handle filenames without extensions', () => {
      const filename = storage.generateUniqueFilename('noextension');

      expect(filename).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should handle multiple dots in filename', () => {
      const filename = storage.generateUniqueFilename('my.test.file.jpg');

      expect(filename).toMatch(/\.jpg$/);
    });
  });

  describe('TEST-FILE-STORAGE-001-DIR: Directory structure creation', () => {
    it('should create YYYY/MM/DD directory structure', () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      const dirPath = storage.getDateBasedDirectory();
      const expectedPath = path.join(testUploadDir, String(year), month, day);

      expect(dirPath).toBe(expectedPath);
    });

    it('should create directory if it does not exist', () => {
      const dirPath = storage.getDateBasedDirectory();
      storage.ensureDirectoryExists(dirPath);

      expect(fs.existsSync(dirPath)).toBe(true);
      expect(fs.statSync(dirPath).isDirectory()).toBe(true);
    });

    it('should not fail if directory already exists', () => {
      const dirPath = storage.getDateBasedDirectory();
      storage.ensureDirectoryExists(dirPath);

      // Call again - should not throw
      expect(() => storage.ensureDirectoryExists(dirPath)).not.toThrow();
    });

    it('should create nested directories recursively', () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      const dirPath = storage.getDateBasedDirectory();
      storage.ensureDirectoryExists(dirPath);

      const yearDir = path.join(testUploadDir, String(year));
      const monthDir = path.join(yearDir, month);
      const dayDir = path.join(monthDir, day);

      expect(fs.existsSync(yearDir)).toBe(true);
      expect(fs.existsSync(monthDir)).toBe(true);
      expect(fs.existsSync(dayDir)).toBe(true);
    });
  });

  describe('TEST-FILE-STORAGE-001-SAVE: File saving', () => {
    it('should save file to correct location', async () => {
      const buffer = Buffer.from('test file content');
      const originalName = 'test.txt';

      const result = await storage.saveFile(buffer, originalName);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(fs.existsSync(result.filePath!)).toBe(true);
    });

    it('should return file metadata after save', async () => {
      const buffer = Buffer.from('test file content');
      const originalName = 'test.jpg';

      const result = await storage.saveFile(buffer, originalName);

      expect(result.success).toBe(true);
      expect(result.storedFilename).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$/i);
      expect(result.filePath).toContain(result.storedFilename!);
      expect(result.fileSize).toBe(buffer.length);
    });

    it('should handle large files', async () => {
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const originalName = 'large.pdf';

      const result = await storage.saveFile(largeBuffer, originalName);

      expect(result.success).toBe(true);
      expect(result.fileSize).toBe(largeBuffer.length);
      expect(fs.existsSync(result.filePath!)).toBe(true);
    });

    it('should fail gracefully if directory is not writable', async () => {
      // Make directory read-only
      const dirPath = storage.getDateBasedDirectory();
      storage.ensureDirectoryExists(dirPath);

      // On Windows, removing write permission is different
      // We'll skip this test on Windows
      if (process.platform !== 'win32') {
        fs.chmodSync(dirPath, 0o444);

        const buffer = Buffer.from('test');
        const result = await storage.saveFile(buffer, 'test.txt');

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();

        // Restore permissions
        fs.chmodSync(dirPath, 0o755);
      }
    });
  });

  describe('TEST-FILE-STORAGE-001-READ: File reading', () => {
    it('should read saved file correctly', async () => {
      const content = 'test file content';
      const buffer = Buffer.from(content);
      const originalName = 'test.txt';

      const saveResult = await storage.saveFile(buffer, originalName);
      const readResult = await storage.readFile(saveResult.filePath!);

      expect(readResult.success).toBe(true);
      expect(readResult.buffer?.toString()).toBe(content);
    });

    it('should return error for non-existent file', async () => {
      const result = await storage.readFile('non-existent-file.txt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('존재하지 않');
    });

    it('should handle binary files', async () => {
      const binaryData = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header
      const saveResult = await storage.saveFile(binaryData, 'test.png');
      const readResult = await storage.readFile(saveResult.filePath!);

      expect(readResult.success).toBe(true);
      expect(readResult.buffer).toEqual(binaryData);
    });
  });

  describe('TEST-FILE-STORAGE-001-DELETE: File deletion', () => {
    it('should delete file successfully', async () => {
      const buffer = Buffer.from('test');
      const saveResult = await storage.saveFile(buffer, 'test.txt');
      const filePath = saveResult.filePath!;

      const deleteResult = await storage.deleteFile(filePath);

      expect(deleteResult.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should return error when deleting non-existent file', async () => {
      const result = await storage.deleteFile('non-existent-file.txt');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should prevent path traversal in delete operations', async () => {
      const result = await storage.deleteFile('../../etc/passwd');

      expect(result.success).toBe(false);
      expect(result.error).toContain('보안');
    });
  });

  describe('TEST-FILE-STORAGE-001-VERSION: Version control', () => {
    it('should create new version when file already exists', async () => {
      const buffer1 = Buffer.from('version 1');
      const buffer2 = Buffer.from('version 2');
      const originalName = 'test.txt';

      const result1 = await storage.saveFile(buffer1, originalName);
      const result2 = await storage.saveFileVersion(result1.storedFilename!, buffer2);

      expect(result2.success).toBe(true);
      expect(result2.version).toBe(2);
      expect(result2.storedFilename).toContain('-v2');
    });

    it('should increment version numbers correctly', async () => {
      const buffer = Buffer.from('test content');
      const originalName = 'test.txt';

      const v1 = await storage.saveFile(buffer, originalName);
      const v2 = await storage.saveFileVersion(v1.storedFilename!, buffer);
      const v3 = await storage.saveFileVersion(v2.storedFilename!, buffer);

      expect(v1.version).toBe(1);
      expect(v2.version).toBe(2);
      expect(v3.version).toBe(3);
    });

    it('should list all versions of a file', async () => {
      const buffer = Buffer.from('test');
      const originalName = 'test.txt';

      const v1 = await storage.saveFile(buffer, originalName);
      await storage.saveFileVersion(v1.storedFilename!, buffer);
      await storage.saveFileVersion(v1.storedFilename!, buffer);

      const versions = await storage.listFileVersions(v1.storedFilename!);

      expect(versions.length).toBe(3);
      expect(versions[0].version).toBe(1);
      expect(versions[1].version).toBe(2);
      expect(versions[2].version).toBe(3);
    });

    it('should retrieve specific version content', async () => {
      const content1 = 'version 1 content';
      const content2 = 'version 2 content';

      const v1 = await storage.saveFile(Buffer.from(content1), 'test.txt');
      const v2 = await storage.saveFileVersion(v1.storedFilename!, Buffer.from(content2));

      const readV1 = await storage.readFile(v1.filePath!);
      const readV2 = await storage.readFile(v2.filePath!);

      expect(readV1.buffer?.toString()).toBe(content1);
      expect(readV2.buffer?.toString()).toBe(content2);
    });
  });

  describe('TEST-FILE-STORAGE-001-PATH: Path security', () => {
    it('should reject absolute paths', async () => {
      const result = await storage.readFile('/etc/passwd');

      expect(result.success).toBe(false);
      expect(result.error).toContain('보안');
    });

    it('should reject path traversal attempts', async () => {
      const result = await storage.readFile('../../sensitive.txt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('보안');
    });

    it('should only allow access to upload directory', async () => {
      const result = await storage.readFile('../../../package.json');

      expect(result.success).toBe(false);
    });
  });
});
