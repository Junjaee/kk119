/**
 * @SPEC:CONSULT-001
 * 상담 메시지 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { MessagingService } from '@/lib/services/messaging-service';
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
    const { searchParams } = new URL(request.url);

    const messagingService = new MessagingService();
    const consultService = new ConsultService();

    try {
      // 상담 존재 및 권한 확인
      const consultation = await consultService.getConsultation(consultId);
      if (!consultation) {
        return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
      }

      // 접근 권한 확인
      const hasAccess =
        session.user.role === 'admin' ||
        session.user.role === 'super_admin' ||
        (session.user.role === 'teacher' && consultation.teacherId === session.user.id) ||
        (session.user.role === 'lawyer' && consultation.lawyerId === session.user.id);

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 메시지 조회
      const limit = searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 50;
      const offset = searchParams.get('offset')
        ? parseInt(searchParams.get('offset')!)
        : 0;

      const messages = await messagingService.getConsultMessages(
        consultId,
        { limit, offset }
      );

      // 읽음 처리 (본인 메시지 아닌 것들)
      if (session.user.role === 'teacher' || session.user.role === 'lawyer') {
        await messagingService.markMessagesAsRead(consultId, session.user.id);
      }

      return NextResponse.json({
        messages,
        consultation: {
          id: consultation.id,
          consultNo: consultation.consultNo,
          status: consultation.status,
        },
      });
    } finally {
      messagingService.close();
      consultService.close();
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const messagingService = new MessagingService();
    const consultService = new ConsultService();

    try {
      // 상담 존재 및 권한 확인
      const consultation = await consultService.getConsultation(consultId);
      if (!consultation) {
        return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
      }

      // 메시지 전송 권한 확인
      const canSend =
        (session.user.role === 'teacher' && consultation.teacherId === session.user.id) ||
        (session.user.role === 'lawyer' && consultation.lawyerId === session.user.id) ||
        session.user.role === 'admin' ||
        session.user.role === 'super_admin';

      if (!canSend) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 상태 확인 - closed, cancelled, expired는 메시지 전송 불가
      if (['closed', 'cancelled', 'expired'].includes(consultation.status)) {
        return NextResponse.json(
          { error: `Cannot send message to ${consultation.status} consultation` },
          { status: 400 }
        );
      }

      // 메시지 전송
      const message = await messagingService.sendMessage({
        consultId,
        senderId: session.user.id,
        message: body.message,
      });

      // 알림 전송 (향후 SPEC-NOTIFY-001에서 구현)
      // await notificationService.notifyNewMessage(consultation, message);

      return NextResponse.json(message, { status: 201 });
    } finally {
      messagingService.close();
      consultService.close();
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}