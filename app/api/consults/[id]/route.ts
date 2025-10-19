/**
 * @SPEC:CONSULT-001
 * 개별 상담 관리 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConsultService } from '@/lib/services/consult-service';
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

    const consultId = parseInt(params.id);
    const consultService = new ConsultService();

    try {
      const consultation = await consultService.getConsultation(consultId);

      if (!consultation) {
        return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
      }

      // 권한 확인
      if (
        session.user.role === 'teacher' &&
        consultation.teacherId !== session.user.id
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (
        session.user.role === 'lawyer' &&
        consultation.lawyerId !== session.user.id
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json(consultation);
    } finally {
      consultService.close();
    }
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const consultService = new ConsultService();

    try {
      const consultation = await consultService.getConsultation(consultId);

      if (!consultation) {
        return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
      }

      // 권한 확인 - 교사만 pending 상태에서 수정 가능
      if (
        session.user.role === 'teacher' &&
        consultation.teacherId === session.user.id &&
        consultation.status === 'pending'
      ) {
        const success = await consultService.updateConsultation(consultId, {
          title: body.title,
          content: body.content,
          category: body.category,
          urgency: body.urgency,
        });

        if (success) {
          const updated = await consultService.getConsultation(consultId);
          return NextResponse.json(updated);
        }
      }

      return NextResponse.json({ error: 'Cannot update consultation' }, { status: 403 });
    } finally {
      consultService.close();
    }
  } catch (error) {
    console.error('Error updating consultation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consultId = parseInt(params.id);
    const consultService = new ConsultService();

    try {
      // 교사가 pending 상태의 상담만 취소 가능
      const success = await consultService.cancelConsultation(
        consultId,
        session.user.id
      );

      if (success) {
        return NextResponse.json({ message: 'Consultation cancelled' });
      }

      return NextResponse.json(
        { error: 'Cannot cancel consultation' },
        { status: 400 }
      );
    } finally {
      consultService.close();
    }
  } catch (error) {
    console.error('Error cancelling consultation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}