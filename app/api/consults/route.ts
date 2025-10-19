/**
 * @SPEC:CONSULT-001
 * 상담 관리 API
 * - 상담 생성/조회
 * - 자동 매칭 없이 pending 상태로 시작
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConsultService } from '@/lib/services/consult-service';
import { getServerSession } from '@/lib/auth/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const consultService = new ConsultService();

    try {
      // 필터 파라미터 파싱
      const filter = {
        teacherId: searchParams.get('teacherId') ? parseInt(searchParams.get('teacherId')!) : undefined,
        lawyerId: searchParams.get('lawyerId') ? parseInt(searchParams.get('lawyerId')!) : undefined,
        status: searchParams.get('status') || undefined,
        category: searchParams.get('category') || undefined,
        urgency: searchParams.get('urgency') || undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      };

      // 역할별 필터 적용
      if (session.user.role === 'teacher') {
        filter.teacherId = session.user.id;
      } else if (session.user.role === 'lawyer') {
        filter.lawyerId = session.user.id;
      }

      const result = await consultService.listConsultations(filter);

      return NextResponse.json(result);
    } finally {
      consultService.close();
    }
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const consultService = new ConsultService();

    try {
      // 상담 생성 (자동 매칭 없이 pending 상태)
      const consultation = await consultService.createConsultation({
        teacherId: session.user.id,
        reportId: body.reportId,
        title: body.title,
        content: body.content,
        category: body.category,
        urgency: body.urgency || 'normal',
      });

      return NextResponse.json(consultation, { status: 201 });
    } finally {
      consultService.close();
    }
  } catch (error) {
    console.error('Error creating consultation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}