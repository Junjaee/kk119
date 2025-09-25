import { NextRequest, NextResponse } from 'next/server';
import { consultDb, consultReplyDb } from '@/lib/db/consult-db';
import { verifyToken } from '@/lib/auth/auth-utils';

// GET - 상담 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultId = parseInt(params.id);

    if (isNaN(consultId)) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 상담 ID입니다.'
        },
        { status: 400 }
      );
    }

    // 상담 정보 가져오기
    const consult = consultDb.findById(consultId);

    if (!consult) {
      return NextResponse.json(
        {
          success: false,
          error: '상담을 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

    // 답변/추가 질문 가져오기
    const replies = consultReplyDb.findByConsultId(consultId);

    return NextResponse.json({
      success: true,
      data: {
        ...consult,
        replies
      }
    });

  } catch (error) {
    console.error('Error fetching consult:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상담 정보를 불러오는데 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// PUT - 상담 답변 작성 (변호사용)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    // 인증 필수
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: '로그인이 필요합니다.'
        },
        { status: 401 }
      );
    }

    // 토큰 검증 (실제로는 변호사 권한 확인 필요)
    try {
      verifyToken(token);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 토큰입니다.'
        },
        { status: 401 }
      );
    }

    const consultId = parseInt(params.id);
    const body = await request.json();
    const { lawyer_id, consult_content } = body;

    if (!lawyer_id || !consult_content) {
      return NextResponse.json(
        {
          success: false,
          error: '변호사 ID와 답변 내용이 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 상담에 변호사 배정 및 답변 작성
    consultDb.assignLawyer(consultId, lawyer_id, consult_content);

    const updatedConsult = consultDb.findById(consultId);

    return NextResponse.json({
      success: true,
      data: updatedConsult,
      message: '답변이 등록되었습니다.'
    });

  } catch (error) {
    console.error('Error updating consult:', error);
    return NextResponse.json(
      {
        success: false,
        error: '답변 등록에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// PATCH - 상담 상태 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    // 인증 필수
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: '로그인이 필요합니다.'
        },
        { status: 401 }
      );
    }

    try {
      verifyToken(token);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 토큰입니다.'
        },
        { status: 401 }
      );
    }

    const consultId = parseInt(params.id);
    const body = await request.json();

    // 상담 업데이트
    consultDb.update(consultId, body);

    const updatedConsult = consultDb.findById(consultId);

    return NextResponse.json({
      success: true,
      data: updatedConsult,
      message: '상담이 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('Error updating consult:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상담 업데이트에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}