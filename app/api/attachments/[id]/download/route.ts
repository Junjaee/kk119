import { NextRequest, NextResponse } from 'next/server';
import { consultAttachmentDb } from '@/lib/db/consult-db';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachmentId = parseInt(params.id);

    if (isNaN(attachmentId)) {
      return NextResponse.json(
        {
          success: false,
          error: '잘못된 파일 ID입니다'
        },
        { status: 400 }
      );
    }

    // TODO: 실제 인증 구현 필요
    // 현재는 테스트용으로 변호사 권한만 확인
    // const user = await getUserFromToken(request);
    // if (!user || user.role !== 'lawyer') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // 첨부파일 정보 조회
    const attachment = consultAttachmentDb.findById(attachmentId);

    if (!attachment) {
      return NextResponse.json(
        {
          success: false,
          error: '파일을 찾을 수 없습니다'
        },
        { status: 404 }
      );
    }

    // TODO: 권한 검증 - 해당 상담의 담당 변호사인지 확인
    // const consult = consultDb.findById(attachment.consult_id);
    // if (consult.lawyer_id !== user.id) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // 파일 경로 확인
    const filePath = path.join(process.cwd(), attachment.file_path);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: '파일이 존재하지 않습니다'
        },
        { status: 404 }
      );
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(filePath);

    // 파일 다운로드 응답
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': attachment.file_type,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.file_name)}"`,
        'Content-Length': attachment.file_size.toString(),
      },
    });

    return response;

  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '파일 다운로드 중 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}