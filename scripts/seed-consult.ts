/**
 * Consult 기능 Mock 데이터 시드 스크립트
 * 실행: npx ts-node scripts/seed-consult.ts
 */

const { consultDb, lawyerDb, consultReplyDb } = require('../lib/db/consult-db');

async function seedConsultData() {
  console.log('🌱 Starting consult data seeding...');

  try {
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
        license_number: '2015-11111',
        bio: '교육 분야 민형사 사건을 전문으로 처리합니다.',
        years_of_experience: 12
      }
    ];

    const lawyerIds: number[] = [];
    for (const lawyer of lawyers) {
      const id = lawyerDb.create(lawyer);
      lawyerIds.push(Number(id));
      console.log(`✅ Created lawyer: ${lawyer.name}`);
    }

    // 2. 상담 사례 생성
    const consults = [
      {
        user_id: 1, // 테스트 사용자 ID
        title: '학부모 민원 관련 건',
        report_type: 'parent',
        incident_date: '2025-08-25',
        report_content: '학부모가 수업 방식에 대해 과도한 민원을 제기하며 협박성 발언을 했습니다. 녹음 파일이 있으며, 증인도 있는 상황입니다.',
        report_status: 'consulting'
      },
      {
        user_id: 1,
        title: '학생 폭언 사건',
        report_type: 'student',
        incident_date: '2025-08-24',
        report_content: '수업 중 학생이 교사에게 욕설과 함께 위협적인 행동을 보였습니다.',
        report_status: 'completed'
      },
      {
        user_id: 1,
        title: '온라인 명예훼손',
        report_type: 'online',
        incident_date: '2025-08-20',
        report_content: 'SNS에서 학생과 학부모가 허위사실을 유포하며 명예를 훼손하고 있습니다.',
        report_status: 'pending'
      }
    ];

    const consultIds: number[] = [];
    for (const consult of consults) {
      const id = consultDb.create(consult);
      consultIds.push(Number(id));
      console.log(`✅ Created consult: ${consult.title}`);
    }

    // 3. 변호사 답변 추가 (첫 번째, 두 번째 상담에만)
    const consultResponses = [
      {
        consultId: consultIds[0],
        lawyerId: lawyerIds[0],
        content: `안녕하세요, 교육법 전문 김변호사입니다.

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

추가적인 법적 조치를 원하시면 상세한 상담을 진행하겠습니다.`
      },
      {
        consultId: consultIds[1],
        lawyerId: lawyerIds[1],
        content: `학생의 폭언과 위협적 행동에 대해서는 다음과 같이 대응하실 수 있습니다.

1. **학교 내 조치**
   - 학생생활지도위원회 개최
   - 선도위원회 징계 요청
   - 학부모 면담 및 서면 경고

2. **법적 조치**
   - 미성년자라도 형사책임능력이 있는 경우 (만 14세 이상) 고소 가능
   - 학부모에 대한 손해배상청구 (민법 제755조)

상황의 심각성을 고려하여 단계적으로 대응하시기를 권합니다.`
      }
    ];

    for (const response of consultResponses) {
      consultDb.assignLawyer(response.consultId, response.lawyerId, response.content);
      console.log(`✅ Added lawyer response to consult ID: ${response.consultId}`);
    }

    // 4. 추가 질문/답변 추가
    const replies = [
      {
        consult_id: consultIds[0],
        user_id: 1,
        content: '녹음 파일의 경우, 제3자가 녹음한 것도 증거로 사용할 수 있나요?',
        is_lawyer: false
      },
      {
        consult_id: consultIds[0],
        user_id: 1,
        content: '제3자가 녹음한 경우에는 통신비밀보호법상 문제가 될 수 있습니다. 다만, 공개된 장소에서의 대화이고 당사자 중 한 명이 동의한 경우라면 증거능력이 인정될 가능성이 있습니다. 구체적인 상황을 더 알려주시면 정확한 답변을 드릴 수 있습니다.',
        is_lawyer: true
      }
    ];

    for (const reply of replies) {
      consultReplyDb.create(reply.consult_id, reply.user_id, reply.content, reply.is_lawyer);
      console.log(`✅ Added reply to consult ID: ${reply.consult_id}`);
    }

    console.log('\n🎉 Consult data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Lawyers created: ${lawyerIds.length}`);
    console.log(`   - Consults created: ${consultIds.length}`);
    console.log(`   - Responses added: ${consultResponses.length}`);
    console.log(`   - Replies added: ${replies.length}`);

  } catch (error) {
    console.error('❌ Error seeding consult data:', error);
    process.exit(1);
  }
}

// 스크립트 실행
seedConsultData();