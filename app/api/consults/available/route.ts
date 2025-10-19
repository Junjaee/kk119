/**
 * @SPEC:CONSULT-001
 * 변호사가 선택 가능한 상담 목록 조회 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { LawyerSelectionService } from '@/lib/services/lawyer-selection-service';
import { getServerSession } from '@/lib/auth/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const selectionService = new LawyerSelectionService();

    try {
      // 필터 파라미터 파싱
      const filters = {
        category: searchParams.get('category') || undefined,
        specialty: searchParams.get('specialty') || undefined,
        urgency: searchParams.get('urgency') || undefined,
        dateFrom: searchParams.get('dateFrom')
          ? new Date(searchParams.get('dateFrom')!)
          : undefined,
        dateTo: searchParams.get('dateTo')
          ? new Date(searchParams.get('dateTo')!)
          : undefined,
        limit: searchParams.get('limit')
          ? parseInt(searchParams.get('limit')!)
          : 20,
        offset: searchParams.get('offset')
          ? parseInt(searchParams.get('offset')!)
          : 0,
      };

      // 변호사가 선택 가능한 상담 목록 조회
      const consultations = await selectionService.getAvailableConsultations(
        session.user.id,
        filters
      );

      // 선택 가능한 상담 수 조회
      const availableCount = await selectionService.getAvailableCount({
        category: filters.category,
        urgency: filters.urgency,
      });

      return NextResponse.json({
        consultations,
        total: availableCount,
        filters,
      });
    } finally {
      selectionService.close();
    }
  } catch (error) {
    console.error('Error fetching available consultations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}