import { NextRequest, NextResponse } from 'next/server';
import { consultDb } from '@/lib/db/consult-db';

export async function GET(request: NextRequest) {
  try {
    // TODO: 실제 인증 구현 필요
    // 현재는 테스트용으로 lawyer_id를 쿼리 파라미터로 받음
    const searchParams = request.nextUrl.searchParams;
    const lawyerId = searchParams.get('lawyer_id') || '1';

    // 변호사가 배정받은 모든 상담 조회
    const consults = consultDb.findByLawyer(parseInt(lawyerId));

    // 최신순으로 정렬
    const sortedConsults = consults.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 최근 5개만 반환
    const recentConsults = sortedConsults.slice(0, 5);

    return NextResponse.json({
      success: true,
      data: recentConsults
    });

  } catch (error) {
    console.error('My cases fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}