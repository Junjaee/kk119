import { NextRequest, NextResponse } from 'next/server';
import { resourceDb } from '@/lib/db/database';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resourceId = parseInt(params.id);

    if (isNaN(resourceId)) {
      return NextResponse.json(
        { error: '잘못된 자료 ID입니다.' },
        { status: 400 }
      );
    }

    // Find resource
    const resource = resourceDb.findById(resourceId);
    if (!resource) {
      return NextResponse.json(
        { error: '자료를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Get file path
    const filePath = path.join(process.cwd(), 'public', resource.file_path);

    try {
      // Read file
      const fileBuffer = await readFile(filePath);

      // Increment download count
      resourceDb.incrementDownloadCount(resourceId);

      // Set appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', resource.file_type);
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(resource.file_name)}"`);
      headers.set('Content-Length', resource.file_size.toString());

      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      });

    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json(
        { error: '파일을 읽을 수 없습니다.' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: '다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}