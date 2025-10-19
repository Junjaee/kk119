/**
 * @SPEC:CONSULT-001
 * 변호사 상담 선택 API
 * - 트랜잭션 락으로 동시 선택 방지
 * - 선착순 배정 보장
 */

import { NextRequest, NextResponse } from 'next/server';
import { LawyerSelectionService } from '@/lib/services/lawyer-selection-service';
import { LawyerWorkloadService } from '@/lib/services/lawyer-workload-service';
import { getServerSession } from '@/lib/auth/auth-config';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consultId = parseInt(params.id);
    const selectionService = new LawyerSelectionService();
    const workloadService = new LawyerWorkloadService();

    try {
      // 먼저 워크로드 확인
      const workload = await workloadService.getWorkload(session.user.id);

      if (!workload.isAvailable) {
        return NextResponse.json(
          {
            error: 'Workload limit reached',
            currentLoad: workload.currentLoad,
            maxLoad: workload.maxLoad
          },
          { status: 400 }
        );
      }

      // 상담 선택 시도 (트랜잭션 락 처리)
      const result = await selectionService.selectConsultation(
        consultId,
        session.user.id
      );

      if (result.success) {
        // 선택 성공 - 업데이트된 워크로드 정보 포함
        const updatedWorkload = await workloadService.getWorkload(session.user.id);

        return NextResponse.json({
          success: true,
          consultation: result.consult,
          workload: {
            currentLoad: updatedWorkload.currentLoad,
            availableSlots: updatedWorkload.availableSlots,
          },
          message: '상담이 성공적으로 배정되었습니다',
        });
      } else {
        // 선택 실패 (다른 변호사가 먼저 선택)
        return NextResponse.json(
          {
            success: false,
            error: result.error || '다른 변호사가 먼저 선택했습니다'
          },
          { status: 409 } // Conflict
        );
      }
    } finally {
      selectionService.close();
      workloadService.close();
    }
  } catch (error) {
    console.error('Error selecting consultation:', error);

    // 특정 에러 메시지 처리
    if (error instanceof Error) {
      if (error.message === 'Already assigned') {
        return NextResponse.json(
          { error: '이미 배정된 상담입니다' },
          { status: 409 }
        );
      }
      if (error.message.includes('Workload limit')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}