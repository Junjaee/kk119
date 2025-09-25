import { NextRequest, NextResponse } from 'next/server';
import { consultDb, consultReplyDb } from '@/lib/db/consult-db';

export async function GET(request: NextRequest) {
  try {
    // TODO: 실제 인증 구현 필요
    // 현재는 테스트용으로 lawyer_id를 쿼리 파라미터로 받음
    const searchParams = request.nextUrl.searchParams;
    const lawyerId = searchParams.get('lawyer_id') || '1';

    // 변호사가 배정받은 모든 상담 조회
    const consults = consultDb.findByLawyer(parseInt(lawyerId));

    // 통계 계산
    const stats = {
      total: consults.length,
      pending: consults.filter(c => c.status === 'pending').length,
      consulting: consults.filter(c => c.status === 'consulting').length,
      completed: consults.filter(c => c.status === 'completed').length,

      // 오늘 배정된 상담
      todayAssigned: consults.filter(c => {
        const today = new Date().toISOString().split('T')[0];
        const consultDate = new Date(c.created_at).toISOString().split('T')[0];
        return consultDate === today;
      }).length,

      // 답변 대기 중인 상담
      awaitingResponse: consults.filter(c =>
        c.status === 'consulting' && !c.lawyer_response
      ).length,

      // 평균 응답 시간 (시간 단위, 답변이 있는 경우만)
      avgResponseTime: (() => {
        const consultedCases = consults.filter(c => c.lawyer_response);
        if (consultedCases.length === 0) return 0;

        const totalHours = consultedCases.reduce((sum, c) => {
          const created = new Date(c.created_at).getTime();
          const responded = new Date(c.updated_at).getTime();
          const hours = (responded - created) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);

        return Math.round(totalHours / consultedCases.length);
      })()
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Lawyer stats fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}