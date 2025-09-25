import { NextRequest, NextResponse } from 'next/server';
import { consultDb, lawyerDb, consultReplyDb } from '@/lib/db/consult-db';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'consult.db'));

export async function GET(request: NextRequest) {
  try {
    console.log('🌱 Starting consult data seeding...');

    // 1. 변호사 프로필 생성
    const lawyers = [
      {
        name: '김변호사',
        specialty: '교육법 전문',
        license_number: '2020-12345',
        bio: '10년 경력의 교육법 전문 변호사입니다. 교권 침해 사건을 전문으로 다루고 있습니다.',
        years_of_experience: 10
      },
      {
        name: '이변호사',
        specialty: '학교폭력 전문',
        license_number: '2018-54321',
        bio: '학교폭력 및 청소년 관련 법률 전문가입니다.',
        years_of_experience: 7
      },
      {
        name: '박변호사',
        specialty: '민형사 전문',
        license_number: '2019-11111',
        bio: '교육 현장의 민형사 문제를 전문으로 처리합니다.',
        years_of_experience: 5
      }
    ];

    const lawyerIds: number[] = [];
    for (const lawyer of lawyers) {
      try {
        const id = lawyerDb.create(lawyer);
        lawyerIds.push(id as number);
        console.log(`✅ Created lawyer: ${lawyer.name}`);
      } catch (error: any) {
        console.log(`⏭️  Lawyer may already exist: ${lawyer.name}`);
        // Simply use predefined IDs if creation fails
        lawyerIds.push(lawyerIds.length + 1);
      }
    }

    // 2. 상담 케이스 생성
    const consults = [
      {
        report_id: 1,
        user_id: 1,
        title: '학부모 민원 관련 법률 자문 요청',
        report_type: 'parent',
        incident_date: '2025-08-25',
        report_content: '학부모가 수업 방식에 대해 과도한 민원을 제기하며 협박성 발언을 했습니다. 녹음 파일이 있으며, 증인도 있는 상황입니다.',
        report_status: 'consulting'
      },
      {
        report_id: 2,
        user_id: 2,
        title: '학생 폭언 및 위협 사건',
        report_type: 'student',
        incident_date: '2025-08-24',
        report_content: '수업 중 학생이 교사에게 욕설과 함께 위협적인 행동을 보였습니다. CCTV 영상이 있고, 다른 학생들이 목격했습니다.',
        report_status: 'consulting'
      },
      {
        report_id: 3,
        user_id: 3,
        title: 'SNS 명예훼손 대응 방안',
        report_type: 'defamation',
        incident_date: '2025-08-23',
        report_content: 'SNS에 허위사실을 유포하여 명예를 훼손당했습니다. 게시물 캡쳐와 증거를 보관하고 있습니다.',
        report_status: 'pending'
      },
      {
        report_id: 4,
        user_id: 1,
        title: '체벌 관련 법적 문제 상담',
        report_type: 'student',
        incident_date: '2025-08-22',
        report_content: '훈육 과정에서 발생한 신체 접촉을 체벌로 신고하겠다고 협박받고 있습니다.',
        report_status: 'pending'
      },
      {
        report_id: 5,
        user_id: 2,
        title: '수업 방해 행위에 대한 법적 조치',
        report_type: 'student',
        incident_date: '2025-08-21',
        report_content: '지속적인 수업 방해 행위에 대한 법적 대응 방안을 문의드립니다.',
        report_status: 'pending'
      }
    ];

    const consultIds: number[] = [];
    for (const consult of consults) {
      const id = consultDb.create(consult);
      consultIds.push(id as number);
      console.log(`✅ Created consult: ${consult.title}`);
    }

    // 3. 일부 상담에 변호사 답변 추가
    if (lawyerIds.length > 0 && consultIds.length > 0) {
      // 첫 번째 상담에 변호사 답변
      consultDb.assignLawyer(consultIds[0], lawyerIds[0], `안녕하세요, 교육법 전문 김변호사입니다.

먼저 선생님께서 겪으신 일에 대해 안타깝게 생각합니다. 제출해주신 내용을 검토한 결과, 다음과 같은 법적 대응이 가능합니다.

1. **형사적 대응**
   - 협박죄 (형법 제283조): 협박성 발언이 해악을 고지하는 수준이라면 협박죄 성립 가능
   - 모욕죄 (형법 제311조): 공연히 모욕적 발언을 한 경우 해당
   - 업무방해죄 (형법 제314조): 정당한 교육활동을 방해한 경우

2. **민사적 대응**
   - 정신적 손해배상청구: 정신적 고통에 대한 위자료 청구 가능
   - 가처분 신청: 추가적인 괴롭힘 방지를 위한 접근금지가처분

3. **교육청 차원의 대응**
   - 교육활동 침해 행위로 신고
   - 학교교권보호위원회 개최 요청

녹음 파일과 증인이 있다는 점은 매우 유리한 증거입니다. 다만, 녹음의 경우 대화 당사자가 녹음한 것이어야 합니다.

추가적인 법적 조치를 원하시면 상세한 상담을 진행하겠습니다.`);

      console.log(`✅ Assigned lawyer to consult 1`);

      // 두 번째 상담에 변호사 답변
      consultDb.assignLawyer(consultIds[1], lawyerIds[1], `학생의 폭언과 위협적 행동에 대해서는 다음과 같이 대응하실 수 있습니다.

1. **학교 내 조치**
   - 학생생활지도위원회 개최
   - 선도위원회 징계 요청
   - 학부모 면담 및 서면 경고

2. **법적 조치**
   - 미성년자라도 형사책임능력이 있는 경우 (만 14세 이상) 고소 가능
   - 학부모에 대한 손해배상청구 (민법 제755조)

상황의 심각성을 고려하여 단계적으로 대응하시기를 권합니다.`);

      console.log(`✅ Assigned lawyer to consult 2`);

      // 세 번째 상담에 변호사 답변 및 완료 처리
      consultDb.assignLawyer(consultIds[2], lawyerIds[2], `SNS 명예훼손에 대한 법적 대응 방안을 안내드립니다.

1. **증거 수집**
   - 게시물 캡처 (URL 포함)
   - 작성자 정보 확인
   - 목격자 진술 확보

2. **형사 고소**
   - 정보통신망법상 명예훼손 (제70조)
   - 모욕죄 적용 검토

3. **민사 손해배상**
   - 정신적 손해에 대한 위자료 청구
   - 게시물 삭제 및 정정보도 요구

빠른 대응이 중요하므로 즉시 조치 취하시기 바랍니다.`);

      // 상담 상태를 completed로 변경
      const updateStmt = db.prepare(`
        UPDATE consults
        SET status = 'completed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(consultIds[2]);

      console.log(`✅ Assigned lawyer to consult 3 and marked as completed`);

      // 4. 추가 질의응답 생성
      consultReplyDb.create({
        consult_id: consultIds[0],
        user_id: 1,
        is_lawyer: false,
        content: '답변 감사합니다. 녹음 파일은 제가 당사자로서 직접 녹음한 것입니다. 형사고소를 진행하려면 어떤 절차를 거쳐야 하나요?'
      });

      consultReplyDb.create({
        consult_id: consultIds[0],
        user_id: lawyerIds[0],
        is_lawyer: true,
        content: '직접 녹음하신 파일이라면 증거로 사용 가능합니다. 형사고소 절차는 다음과 같습니다:\n\n1. 고소장 작성 (사실관계를 구체적으로 기재)\n2. 증거자료 준비 (녹음파일, 증인 진술서 등)\n3. 관할 경찰서 또는 검찰청에 고소장 제출\n4. 경찰 조사 협조\n\n필요하시다면 고소장 작성을 도와드릴 수 있습니다.'
      });

      console.log(`✅ Created consultation replies`);
    }

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      data: {
        lawyers: lawyerIds.length,
        consults: consultIds.length
      }
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed data' },
      { status: 500 }
    );
  }
}