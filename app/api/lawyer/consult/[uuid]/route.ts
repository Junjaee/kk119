import { NextRequest, NextResponse } from 'next/server';
import { consultDb, consultReplyDb, consultAttachmentDb } from '@/lib/db/consult-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const uuid = params.uuid;

    // TODO: 실제 인증 구현 필요
    // 현재는 테스트용으로 변호사 ID 하드코딩
    const lawyerId = 1; // 실제로는 JWT 토큰에서 추출

    // UUID로 상담 조회
    const consult = consultDb.findByUuid(uuid);

    if (!consult) {
      return NextResponse.json(
        {
          success: false,
          error: '상담을 찾을 수 없습니다'
        },
        { status: 404 }
      );
    }

    // 권한 검증: 담당 변호사만 접근 가능
    if (consult.lawyer_id !== lawyerId) {
      return NextResponse.json(
        {
          success: false,
          error: '이 상담에 접근 권한이 없습니다'
        },
        { status: 403 }
      );
    }

    // 답변 내역 조회
    const replies = consultReplyDb.findByConsultId(consult.id);

    // 첨부파일 조회
    const attachments = consultAttachmentDb.findByConsultId(consult.id);

    // 사용자 닉네임 생성 (개인정보 보호)
    const consultWithUserInfo = {
      ...consult,
      user_nickname: `teacher${consult.user_id}`
    };

    // 답변에도 닉네임 적용
    const repliesWithUserInfo = replies.map((reply: any) => ({
      ...reply,
      user_nickname: reply.is_lawyer ? `lawyer${reply.user_id}` : `teacher${reply.user_id}`
    }));

    return NextResponse.json({
      success: true,
      data: {
        consult: consultWithUserInfo,
        replies: repliesWithUserInfo,
        attachments: attachments
      }
    });

  } catch (error) {
    console.error('Consult detail fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}