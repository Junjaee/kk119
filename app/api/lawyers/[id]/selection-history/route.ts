/**
 * @SPEC:CONSULT-001
 * 변호사 상담 선택 이력 조회 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { LawyerSelectionService } from '@/lib/services/lawyer-selection-service';
import { getServerSession } from '@/lib/auth/auth-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lawyerId = parseInt(params.id);
    const { searchParams } = new URL(request.url);

    // 권한 확인 - 본인 또는 관리자만 조회 가능
    if (
      session.user.role === 'lawyer' && session.user.id !== lawyerId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (
      session.user.role !== 'lawyer' &&
      session.user.role !== 'admin' &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const selectionService = new LawyerSelectionService();

    try {
      const limit = searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10;

      const history = await selectionService.getSelectionHistory(lawyerId, limit);

      // 통계 정보 추가
      const stats = {
        total: history.length,
        completed: history.filter(h => h.status === 'completed').length,
        inProgress: history.filter(h => h.status === 'in_progress').length,
        assigned: history.filter(h => h.status === 'assigned').length,
      };

      return NextResponse.json({
        lawyerId,
        history,
        stats,
      });
    } finally {
      selectionService.close();
    }
  } catch (error) {
    console.error('Error fetching selection history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}