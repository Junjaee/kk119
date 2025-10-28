// @CODE:FILE-001 | Chain: SPEC-FILE-001 -> CODE-FILE-001
// Report files API endpoint - Integration with SPEC-REPORT-001

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify-token';
import db from '@/lib/db/database';
import { type FileRecord } from '@/lib/services/file-service';
import { FILE_HTTP_STATUS } from '@/lib/constants/file-constants';

/**
 * GET /api/files/report/[reportId] - Get all files for a report
 * @CODE:FILE-001-REPORT-FILES-API
 *
 * @description
 * Lists all files attached to a specific report
 * Useful for integration with SPEC-REPORT-001
 *
 * @access Teacher (owner), Admin, SuperAdmin, Assigned Lawyer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
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
    const reportId = parseInt(params.reportId, 10);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: '유효하지 않은 신고 ID입니다.' },
        { status: FILE_HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check if report exists
    const report = db
      .prepare('SELECT * FROM reports WHERE id = ?')
      .get(reportId) as any;

    if (!report) {
      return NextResponse.json(
        { error: '신고를 찾을 수 없습니다.' },
        { status: FILE_HTTP_STATUS.NOT_FOUND }
      );
    }

    // Check access permissions
    const canAccess =
      user.role === 'admin' ||
      user.role === 'admin' ||
      report.teacher_id === user.id ||
      (user.role === 'lawyer' && report.lawyer_id === user.id);

    if (!canAccess) {
      return NextResponse.json(
        { error: '이 신고의 파일에 접근할 권한이 없습니다.' },
        { status: FILE_HTTP_STATUS.FORBIDDEN }
      );
    }

    // Get all files for this report
    const files = db
      .prepare(
        `SELECT * FROM files
         WHERE report_id = ?
         AND deleted_at IS NULL
         ORDER BY uploaded_at DESC`
      )
      .all(reportId) as FileRecord[];

    return NextResponse.json({
      success: true,
      data: {
        reportId: reportId,
        files: files.map((file) => ({
          id: file.id,
          originalFilename: file.original_filename,
          storedFilename: file.stored_filename,
          fileSize: file.file_size,
          mimeType: file.mime_type,
          fileExtension: file.file_extension,
          uploadedBy: file.uploader_id,
          uploadedAt: file.uploaded_at,
        })),
        totalFiles: files.length,
        totalSize: files.reduce((sum, f) => sum + f.file_size, 0),
      },
    });
  } catch (error: any) {
    console.error('Get report files error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: FILE_HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
