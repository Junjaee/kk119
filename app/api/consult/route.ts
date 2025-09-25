import { NextRequest, NextResponse } from 'next/server';
import { consultDb } from '@/lib/db/consult-db';
import { verifyToken } from '@/lib/auth/auth-utils';

// GET - 상담 목록 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    // 인증 확인 (옵션 - 인증된 사용자는 자신의 상담만 보도록 필터링 가능)
    let userId: number | undefined;
    if (token) {
      try {
        const decoded = verifyToken(token);
        userId = decoded.userId;
      } catch {
        // 토큰이 유효하지 않아도 공개 상담 목록은 볼 수 있음
      }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    // 상담 목록 가져오기
    const consults = consultDb.findAll(userId, status);

    // 통계 가져오기
    const stats = consultDb.getStats(userId);

    return NextResponse.json({
      success: true,
      data: {
        consults,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching consults:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상담 목록을 불러오는데 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// POST - 새 상담 요청 생성
export async function POST(request: NextRequest) {
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

    let userId: number;
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 토큰입니다.'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, report_type, incident_date, report_content, report_id } = body;

    // 유효성 검사
    if (!title || !report_type || !incident_date || !report_content) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 입력 항목을 모두 작성해주세요.'
        },
        { status: 400 }
      );
    }

    // 상담 생성
    const consultId = consultDb.create({
      report_id,
      user_id: userId,
      title,
      report_type,
      incident_date,
      report_content,
      report_status: 'pending'
    });

    const newConsult = consultDb.findById(Number(consultId));

    return NextResponse.json({
      success: true,
      data: newConsult,
      message: '상담 요청이 접수되었습니다.'
    });

  } catch (error) {
    console.error('Error creating consult:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상담 요청 생성에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}