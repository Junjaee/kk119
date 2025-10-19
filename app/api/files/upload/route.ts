// @CODE:FILE-001 | Chain: SPEC-FILE-001 -> CODE-FILE-001
// File upload API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify-token';
import db from '@/lib/db/database';
import { FileValidator } from '@/lib/services/file-validator';
import { FileStorage } from '@/lib/services/file-storage';
import { v4 as uuidv4 } from 'uuid';
import { FILE_ERROR_MESSAGES, FILE_SUCCESS_MESSAGES, FILE_HTTP_STATUS } from '@/lib/constants/file-constants';

const fileValidator = new FileValidator();
const fileStorage = new FileStorage();

/**
 * POST /api/files/upload - Upload a file
 * @CODE:FILE-001-UPLOAD-API
 *
 * @description
 * Handles multipart file upload with validation and storage
 *
 * Process:
 * 1. Verify authentication
 * 2. Parse multipart FormData
 * 3. Validate file (size, type, extension, security)
 * 4. Save file to storage
 * 5. Create database record
 * 6. Return file metadata
 *
 * @access Teacher, Lawyer, Admin, SuperAdmin
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: FILE_HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { user } = authResult;

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const reportId = formData.get('report_id') as string | null;
    const consultId = formData.get('consult_id') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: FILE_HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 3. Validate file
    const validationResult = fileValidator.validateFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: FILE_HTTP_STATUS.UNPROCESSABLE_ENTITY }
      );
    }

    // 4. Save file to storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const saveResult = await fileStorage.saveFile(buffer, file.name);

    if (!saveResult.success) {
      return NextResponse.json(
        { error: saveResult.error || FILE_ERROR_MESSAGES.STORAGE_WRITE_FAILED },
        { status: FILE_HTTP_STATUS.INTERNAL_ERROR }
      );
    }

    // 5. Create database record
    const fileId = uuidv4();
    const ext = file.name.substring(file.name.lastIndexOf('.'));

    try {
      const stmt = db.prepare(`
        INSERT INTO files (
          id,
          original_filename,
          stored_filename,
          file_path,
          file_size,
          mime_type,
          file_extension,
          uploader_id,
          report_id,
          consult_id,
          uploaded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        fileId,
        file.name,
        saveResult.storedFilename,
        saveResult.filePath,
        file.size,
        file.type,
        ext,
        user.id,
        reportId || null,
        consultId || null
      );

      // 6. Return success response
      return NextResponse.json(
        {
          success: true,
          message: FILE_SUCCESS_MESSAGES.UPLOAD_SUCCESS,
          data: {
            id: fileId,
            originalFilename: file.name,
            storedFilename: saveResult.storedFilename,
            filePath: saveResult.filePath,
            fileSize: file.size,
            mimeType: file.type,
            fileExtension: ext,
            uploadedAt: new Date().toISOString(),
          },
        },
        { status: FILE_HTTP_STATUS.CREATED }
      );
    } catch (dbError: any) {
      // Rollback: delete the saved file if database insert fails
      await fileStorage.deleteFile(saveResult.filePath!);

      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: FILE_HTTP_STATUS.INTERNAL_ERROR }
      );
    }
  } catch (error: any) {
    console.error('File upload error:', error);

    return NextResponse.json(
      {
        error: error.message || FILE_ERROR_MESSAGES.UPLOAD_FAILED,
      },
      { status: FILE_HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
