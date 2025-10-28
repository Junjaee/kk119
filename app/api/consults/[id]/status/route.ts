/**
 * @SPEC:CONSULT-001
 * 상담 상태 변경 API
 * - 상태 전환 검증
 * - assigned 이후 수정 불가
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConsultService } from '@/lib/services/consult-service';
import { getServerSession } from '@/lib/auth/auth-config';
import { isValidStatusTransition, CONSULT_STATUS } from '@/lib/types/consult';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consultId = parseInt(params.id);
    const body = await request.json();
    const newStatus = body.status;

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const consultService = new ConsultService();

    try {
      const consultation = await consultService.getConsultation(consultId);

      if (!consultation) {
        return NextResponse.json(
          { error: 'Consultation not found' },
          { status: 404 }
        );
      }

      // 권한 확인
      let hasPermission = false;

      // 관리자는 모든 상태 변경 가능
      if (session.user.role === 'admin' || session.user.role === 'admin') {
        hasPermission = true;
      }
      // 교사는 본인 상담의 pending → cancelled만 가능
      else if (
        session.user.role === 'teacher' &&
        consultation.teacherId === session.user.id &&
        consultation.status === CONSULT_STATUS.PENDING &&
        newStatus === CONSULT_STATUS.CANCELLED
      ) {
        hasPermission = true;
      }
      // 변호사는 본인 배정된 상담의 상태 진행만 가능
      else if (
        session.user.role === 'lawyer' &&
        consultation.lawyerId === session.user.id
      ) {
        // assigned → in_progress → completed 진행만 가능
        if (
          (consultation.status === CONSULT_STATUS.ASSIGNED &&
            newStatus === CONSULT_STATUS.IN_PROGRESS) ||
          (consultation.status === CONSULT_STATUS.IN_PROGRESS &&
            newStatus === CONSULT_STATUS.COMPLETED)
        ) {
          hasPermission = true;
        }
      }

      if (!hasPermission) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 상태 전환 유효성 검증
      const currentStatus = consultation.status as any;
      if (!isValidStatusTransition(currentStatus, newStatus)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${consultation.status} to ${newStatus}`
          },
          { status: 400 }
        );
      }

      // 상태 업데이트
      const success = await consultService.updateStatus(
        consultId,
        newStatus,
        session.user.id
      );

      if (success) {
        const updated = await consultService.getConsultation(consultId);
        return NextResponse.json({
          success: true,
          consultation: updated,
          message: `Status updated to ${newStatus}`
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to update status' },
          { status: 500 }
        );
      }
    } finally {
      consultService.close();
    }
  } catch (error) {
    console.error('Error updating consultation status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}