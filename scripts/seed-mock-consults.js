const Database = require('better-sqlite3');
const path = require('path');

// Initialize database connection
const dbPath = path.join(__dirname, '..', 'data', 'consult.db');
const db = new Database(dbPath);

// Clear existing data
db.exec('DELETE FROM consult_replies');
db.exec('DELETE FROM consults');
db.exec('DELETE FROM lawyers');

// Insert lawyers
const lawyers = [
  {
    id: 1,
    name: '김민수',
    specialty: '교육법',
    license_number: 'LAW2024001',
    bio: '교육 분야 전문 변호사로 10년 이상의 경력을 보유하고 있습니다.',
    years_of_experience: 10,
    is_verified: 1
  },
  {
    id: 2,
    name: '이서연',
    specialty: '노동법',
    license_number: 'LAW2024002',
    bio: '교원 노동권 및 근로환경 개선 전문 변호사입니다.',
    years_of_experience: 8,
    is_verified: 1
  },
  {
    id: 3,
    name: '박정호',
    specialty: '형사법',
    license_number: 'LAW2024003',
    bio: '교권 침해 관련 형사 사건 전문 변호사입니다.',
    years_of_experience: 15,
    is_verified: 1
  }
];

const lawyerStmt = db.prepare(`
  INSERT INTO lawyers (id, name, specialty, license_number, bio, years_of_experience, is_verified)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

lawyers.forEach(lawyer => {
  lawyerStmt.run(
    lawyer.id,
    lawyer.name,
    lawyer.specialty,
    lawyer.license_number,
    lawyer.bio,
    lawyer.years_of_experience,
    lawyer.is_verified
  );
});

// Insert consults
const consults = [
  // 미담당 상담들
  {
    user_id: 1,
    title: '학부모의 수업 방해 및 폭언',
    report_type: 'verbal',
    incident_date: '2025-09-20 14:30:00',
    report_content: '수업 중 학부모가 교실에 무단침입하여 수업을 방해하고 학생들 앞에서 폭언을 했습니다. 이에 대한 법적 대응 방안을 문의드립니다.',
    status: 'pending',
    created_at: '2025-09-21 09:00:00'
  },
  {
    user_id: 2,
    title: '학생 폭력 및 기물파손',
    report_type: 'violence',
    incident_date: '2025-09-19 11:00:00',
    report_content: '학생이 교사에게 물건을 던지고 교실 기물을 파손했습니다. 신체적 위협을 느껴 수업 진행이 불가능한 상황입니다.',
    status: 'pending',
    created_at: '2025-09-20 15:30:00'
  },
  {
    user_id: 3,
    title: 'SNS 명예훼손 사건',
    report_type: 'defamation',
    incident_date: '2025-09-18 20:00:00',
    report_content: '학부모가 SNS에 허위사실을 유포하여 명예를 훼손당했습니다. 게시물이 빠르게 확산되고 있어 긴급한 대응이 필요합니다.',
    status: 'pending',
    created_at: '2025-09-19 08:45:00'
  },

  // 담당된 상담들 (답변대기)
  {
    user_id: 4,
    lawyer_id: 1,
    title: '체벌 관련 허위 신고 협박',
    report_type: 'threat',
    incident_date: '2025-09-17 13:00:00',
    report_content: '정당한 생활지도를 체벌로 왜곡하여 신고하겠다고 협박하는 학부모가 있습니다. 어떻게 대응해야 할까요?',
    status: 'reviewing',
    created_at: '2025-09-17 16:00:00',
    claimed_at: '2025-09-18 10:00:00'
  },
  {
    user_id: 5,
    lawyer_id: 2,
    title: '수업 중 욕설 및 폭언',
    report_type: 'sexual',
    incident_date: '2025-09-16 10:30:00',
    report_content: '학생이 수업 중 교사에게 지속적으로 욕설과 폭언을 했습니다. 다른 학생들의 학습권도 침해되고 있습니다.',
    status: 'reviewing',
    created_at: '2025-09-16 14:00:00',
    claimed_at: '2025-09-17 09:00:00'
  },

  // 답변완료 상담
  {
    user_id: 6,
    lawyer_id: 1,
    title: '학부모 민원 대응 방안',
    report_type: 'verbal',
    incident_date: '2025-09-15 15:00:00',
    report_content: '불합리한 민원을 지속적으로 제기하는 학부모에 대한 대응 방안을 문의합니다.',
    consult_content: '해당 사안은 교육활동 침해로 볼 수 있습니다. 학교 차원에서 교권보호위원회를 개최하고, 필요시 법적 조치를 취할 수 있습니다.',
    status: 'answered',
    created_at: '2025-09-15 16:30:00',
    claimed_at: '2025-09-16 09:00:00',
    answered_at: '2025-09-16 11:00:00'
  },
  {
    user_id: 7,
    lawyer_id: 3,
    title: '학생 폭력 사건 처리',
    report_type: 'violence',
    incident_date: '2025-09-14 11:30:00',
    report_content: '학생이 교사를 밀치고 위협적인 행동을 했습니다. 형사 고발이 가능한지 문의드립니다.',
    consult_content: '폭행죄로 형사 고발이 가능합니다. 증거 수집(CCTV, 목격자 진술서 등)을 먼저 진행하시고, 경찰서에 고소장을 제출하시기 바랍니다.',
    status: 'answered',
    created_at: '2025-09-14 15:00:00',
    claimed_at: '2025-09-15 10:00:00',
    answered_at: '2025-09-15 14:00:00'
  },

  // 추가답변 필요 상담
  {
    user_id: 8,
    lawyer_id: 2,
    title: '성희롱 발언 대처법',
    report_type: 'harassment',
    incident_date: '2025-09-13 14:00:00',
    report_content: '학부모가 상담 중 부적절한 성적 발언을 했습니다. 어떻게 대응해야 할까요?',
    consult_content: '성희롱은 명백한 범죄 행위입니다. 즉시 학교에 보고하고, 증거를 수집한 후 경찰에 신고하시기 바랍니다.',
    status: 'follow_up',
    created_at: '2025-09-13 16:00:00',
    claimed_at: '2025-09-14 09:00:00',
    answered_at: '2025-09-14 11:00:00'
  }
];

const consultStmt = db.prepare(`
  INSERT INTO consults (
    user_id, lawyer_id, title, report_type, incident_date,
    report_content, consult_content, status, created_at, claimed_at, answered_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let lastConsultId;
consults.forEach((consult, index) => {
  const result = consultStmt.run(
    consult.user_id,
    consult.lawyer_id || null,
    consult.title,
    consult.report_type,
    consult.incident_date,
    consult.report_content,
    consult.consult_content || null,
    consult.status,
    consult.created_at,
    consult.claimed_at || null,
    consult.answered_at || null
  );

  // Save the ID of the follow_up consult
  if (consult.status === 'follow_up') {
    lastConsultId = result.lastInsertRowid;
  }
});

// Insert some replies for follow_up case
if (lastConsultId) {
  const replyStmt = db.prepare(`
    INSERT INTO consult_replies (consult_id, user_id, content, is_lawyer, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  // 추가 질문 (교사가 작성)
  replyStmt.run(
    lastConsultId, // consult_id for follow_up case
    8, // user_id (teacher)
    '감사합니다. 추가로 질문드립니다. 녹음 파일이 있는데 이것도 증거로 사용 가능한가요?',
    0, // not lawyer
    '2025-09-14 16:00:00'
  );
}

// Show statistics
const stats = db.prepare(`
  SELECT status, COUNT(*) as count
  FROM consults
  GROUP BY status
`).all();

console.log('\n=== 데이터 시딩 완료 ===\n');
console.log('변호사:', lawyers.length, '명');
console.log('총 상담:', consults.length, '건');
console.log('\n상태별 분포:');
stats.forEach(s => {
  const labels = {
    'pending': '대기중',
    'reviewing': '답변대기',
    'answered': '답변완료',
    'follow_up': '추가답변',
    'completed': '종료'
  };
  console.log(`  ${labels[s.status] || s.status}: ${s.count}건`);
});

console.log('\n✅ Mock 데이터가 성공적으로 데이터베이스에 추가되었습니다!');

db.close();