// @CODE:FILE-001 | Chain: SPEC-FILE-001 -> CODE-FILE-001
// File download API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify-token';
import db from '@/lib/db/database';
import { FileService, type FileRecord } from '@/lib/services/file-service';
import { FileStorage } from '@/lib/services/file-storage';
import { FILE_ERROR_MESSAGES, FILE_HTTP_STATUS } from '@/lib/constants/file-constants';

const fileService = new FileService(db);
const fileStorage = new FileStorage();

/**
 * GET /api/files/[id]/download - Download file
 * @CODE:FILE-001-DOWNLOAD-API
 *
 * @description
 * Downloads file with proper Content-Disposition header
 * Streams file to response for performance
 * Checks access permissions before download
 *
 * @queryParams
 * - inline: (optional) Set to "true" to display in browser instead of forcing download
 *
 * @access Owner, Admin, SuperAdmin, Assigned Lawyer
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

    // Check if user can download this file
    const canDownload = await fileService.canDownloadFile(
      fileId,
      user.id,
      user.role
    );

    if (!canDownload) {
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

    // Read file from storage
    const readResult = await fileStorage.readFile(file.file_path);

    if (!readResult.success || !readResult.buffer) {
      return NextResponse.json(
        { error: readResult.error || FILE_ERROR_MESSAGES.STORAGE_READ_FAILED },
        { status: FILE_HTTP_STATUS.INTERNAL_ERROR }
      );
    }

    // Determine Content-Disposition
    const { searchParams } = new URL(request.url);
    const inline = searchParams.get('inline') === 'true';
    const disposition = inline ? 'inline' : 'attachment';

    // Set response headers
    const headers = new Headers();
    headers.set('Content-Type', file.mime_type);
    headers.set(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(file.original_filename)}"`
    );
    headers.set('Content-Length', file.file_size.toString());
    headers.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour

    // Return file buffer
    return new NextResponse(readResult.buffer, {
      status: FILE_HTTP_STATUS.SUCCESS,
      headers,
    });
  } catch (error: any) {
    console.error('Download file error:', error);
    return NextResponse.json(
      { error: error.message || FILE_ERROR_MESSAGES.DOWNLOAD_FAILED },
      { status: FILE_HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
