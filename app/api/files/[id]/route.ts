// @CODE:FILE-001 | Chain: SPEC-FILE-001 -> CODE-FILE-001
// File detail API endpoints (GET, DELETE, PATCH)

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify-token';
import db from '@/lib/db/database';
import { FileService, type FileRecord } from '@/lib/services/file-service';
import { FileStorage } from '@/lib/services/file-storage';
import { FILE_ERROR_MESSAGES, FILE_SUCCESS_MESSAGES, FILE_HTTP_STATUS } from '@/lib/constants/file-constants';

const fileService = new FileService(db);
const fileStorage = new FileStorage();

/**
 * GET /api/files/[id] - Get file metadata
 * @CODE:FILE-001-GET-API
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

    return NextResponse.json({
      success: true,
      data: file,
    });
  } catch (error: any) {
    console.error('Get file error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: FILE_HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}

/**
 * DELETE /api/files/[id] - Delete file
 * @CODE:FILE-001-DELETE-API
 *
 * @description
 * Performs soft delete (sets deleted_at timestamp)
 * Also deletes physical file from storage
 */
export async function DELETE(
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

    // Check if user can delete this file
    const canDelete = await fileService.canDeleteFile(fileId, user.id, user.role);
    if (!canDelete) {
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

    // Delete from database (soft delete)
    const stmt = db.prepare(`
      UPDATE files
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(fileId);

    // Delete physical file
    await fileStorage.deleteFile(file.file_path);

    return NextResponse.json({
      success: true,
      message: FILE_SUCCESS_MESSAGES.DELETE_SUCCESS,
      data: {
        id: fileId,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: FILE_HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}

/**
 * PATCH /api/files/[id] - Update file metadata
 * @CODE:FILE-001-PATCH-API
 *
 * @description
 * Allows updating original_filename only
 * Only owner and admins can update
 */
export async function PATCH(
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

    // Parse request body
    const body = await request.json();
    const { originalFilename } = body;

    if (!originalFilename) {
      return NextResponse.json(
        { error: '원본 파일명이 제공되지 않았습니다.' },
        { status: FILE_HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Update database
    const stmt = db.prepare(`
      UPDATE files
      SET original_filename = ?
      WHERE id = ?
    `);
    stmt.run(originalFilename, fileId);

    // Get updated file
    const updatedFile = db
      .prepare('SELECT * FROM files WHERE id = ?')
      .get(fileId) as FileRecord;

    return NextResponse.json({
      success: true,
      message: '파일 정보가 업데이트되었습니다.',
      data: updatedFile,
    });
  } catch (error: any) {
    console.error('Update file error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: FILE_HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
