import { NextRequest, NextResponse } from 'next/server';
import { consultDb, consultReplyDb } from '@/lib/db/consult-db';

export async function GET(request: NextRequest) {
  try {
    // TODO: 실제 인증 구현 필요
    // 현재는 테스트용으로 lawyer_id를 쿼리 파라미터로 받음
    const searchParams = request.nextUrl.searchParams;
    const lawyerId = searchParams.get('lawyer_id') || '1';
    const status = searchParams.get('status');

    // 변호사가 배정받은 상담 조회 (개인정보 포함)
    let consults = consultDb.findByLawyer(parseInt(lawyerId));

    // 상태별 필터링
    if (status) {
      consults = consults.filter(c => c.status === status);
    }

    // 각 상담에 대한 답변 개수 추가
    const consultsWithReplyCount = consults.map(consult => {
      const replies = consultReplyDb.findByConsultId(consult.id);
      return {
        ...consult,
        reply_count: replies.length,
        has_lawyer_response: consult.consult_content ? true : false,
        claimed_at: consult.claimed_at // 담당 시간 포함
      };
    });

    return NextResponse.json({
      success: true,
      data: consultsWithReplyCount
    });

  } catch (error) {
    console.error('Lawyer cases fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}