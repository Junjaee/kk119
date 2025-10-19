// @CODE:FILE-001 | Chain: SPEC-FILE-001 -> CODE-FILE-001
// File versions API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify-token';
import db from '@/lib/db/database';
import { FileService, type FileRecord } from '@/lib/services/file-service';
import { FileStorage } from '@/lib/services/file-storage';
import { FileValidator } from '@/lib/services/file-validator';
import { FILE_ERROR_MESSAGES, FILE_SUCCESS_MESSAGES, FILE_HTTP_STATUS } from '@/lib/constants/file-constants';

const fileService = new FileService(db);
const fileStorage = new FileStorage();
const fileValidator = new FileValidator();

/**
 * GET /api/files/[id]/versions - List all versions of a file
 * @CODE:FILE-001-VERSIONS-LIST-API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: FILE_HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { user } = authResult;
    const fileId = params.id;

    // Check if user can access this file
    const canAccess = await fileService.canAccessFile(fileId, user.id, user.role);
    if (!canAccess) {
      return NextResponse.json(
        { error: FILE_ERROR_MESSAGES.NO_PERMISSION },
        { status: FILE_HTTP_STATUS.FORBIDDEN }
      );
    }

    // Get file record
    const file = db
      .prepare('SELECT * FROM files WHERE id = ? AND deleted_at IS NULL')
      .get(fileId) as FileRecord | undefined;

    if (!file) {
      return NextResponse.json(
        { error: FILE_ERROR_MESSAGES.FILE_NOT_FOUND },
        { status: FILE_HTTP_STATUS.NOT_FOUND }
      );
    }

    // List all versions
    const versions = await fileStorage.listFileVersions(file.stored_filename);

    return NextResponse.json({
      success: true,
      data: {
        fileId: file.id,
        originalFilename: file.original_filename,
        versions: versions.map((v) => ({
          version: v.version,
          storedFilename: v.storedFilename,
          filePath: v.filePath,
          createdAt: v.createdAt,
        })),
        totalVersions: versions.length,
      },
    });
  } catch (error: any) {
    console.error('List versions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: FILE_HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}

/**
 * POST /api/files/[id]/versions - Upload new version of file
 * @CODE:FILE-001-VERSIONS-UPLOAD-API
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: FILE_HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { user } = authResult;
    const fileId = params.id;

    // Check if user can access this file
    const canAccess = await fileService.canAccessFile(fileId, user.id, user.role);
    if (!canAccess) {
      return NextResponse.json(
        { error: FILE_ERROR_MESSAGES.NO_PERMISSION },
        { status: FILE_HTTP_STATUS.FORBIDDEN }
      );
    }

    // Get file record
    const file = db
      .prepare('SELECT * FROM files WHERE id = ? AND deleted_at IS NULL')
      .get(fileId) as FileRecord | undefined;

    if (!file) {
      return NextResponse.json(
        { error: FILE_ERROR_MESSAGES.FILE_NOT_FOUND },
        { status: FILE_HTTP_STATUS.NOT_FOUND }
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const newFile = formData.get('file') as File;

    if (!newFile) {
      return NextResponse.json(
        { error: '새 버전 파일이 제공되지 않았습니다.' },
        { status: FILE_HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate file
    const validationResult = fileValidator.validateFile({
      name: newFile.name,
      size: newFile.size,
      type: newFile.type,
    });

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: FILE_HTTP_STATUS.UNPROCESSABLE_ENTITY }
      );
    }

    // Ensure same file type as original
    if (newFile.type !== file.mime_type) {
      return NextResponse.json(
        { error: '새 버전은 기존 파일과 동일한 타입이어야 합니다.' },
        { status: FILE_HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Save new version
    const bytes = await newFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const saveResult = await fileStorage.saveFileVersion(
      file.stored_filename,
      buffer
    );

    if (!saveResult.success) {
      return NextResponse.json(
        { error: saveResult.error || FILE_ERROR_MESSAGES.STORAGE_WRITE_FAILED },
        { status: FILE_HTTP_STATUS.INTERNAL_ERROR }
      );
    }

    // Update database record with new version info
    const updateStmt = db.prepare(`
      UPDATE files
      SET stored_filename = ?,
          file_path = ?,
          file_size = ?
      WHERE id = ?
    `);

    updateStmt.run(
      saveResult.storedFilename,
      saveResult.filePath,
      newFile.size,
      fileId
    );

    return NextResponse.json(
      {
        success: true,
        message: '새 버전이 업로드되었습니다.',
        data: {
          id: fileId,
          version: saveResult.version,
          storedFilename: saveResult.storedFilename,
          filePath: saveResult.filePath,
          fileSize: newFile.size,
        },
      },
      { status: FILE_HTTP_STATUS.CREATED }
    );
  } catch (error: any) {
    console.error('Upload version error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: FILE_HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
