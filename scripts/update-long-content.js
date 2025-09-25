const Database = require('better-sqlite3');
const path = require('path');

// Initialize database connection
const dbPath = path.join(__dirname, '..', 'data', 'consult.db');
const db = new Database(dbPath);

// 긴 내용으로 업데이트할 상담 내용
const longContent = `수업 중 학부모가 교실에 무단침입하여 수업을 방해하고 학생들 앞에서 폭언을 했습니다.

구체적인 상황은 다음과 같습니다:

1. 오전 10시 30분경, 2교시 수학 수업 진행 중 학부모 A씨가 노크 없이 교실문을 열고 들어왔습니다.

2. 본인의 자녀가 전날 받은 수행평가 점수에 대해 큰 소리로 항의하기 시작했습니다. 학생 30명이 모두 지켜보는 가운데 "선생이 우리 아이를 차별한다", "이런 식으로 가르쳐서 애들이 뭘 배우겠냐" 등의 폭언을 했습니다.

3. 제가 일단 학생들에게는 자습을 시키고 복도에서 대화하자고 했으나, 학부모는 "여기서 다 들으라"며 계속해서 소리를 질렀습니다.

4. 약 15분간 수업이 완전히 중단되었고, 일부 학생들은 무서워서 울기도 했습니다.

5. 교감 선생님이 오신 후에야 겨우 학부모를 교실 밖으로 모실 수 있었습니다.

이러한 행위는 명백한 교육활동 침해이며, 학생들의 학습권도 심각하게 침해당했습니다. 또한 저는 극심한 정신적 스트레스를 받았고, 그 이후로도 수업 진행에 어려움을 겪고 있습니다.

법적 대응 방안과 향후 이런 일이 재발하지 않도록 예방할 수 있는 방법에 대해 자문을 구하고자 합니다.`;

// 첫 번째 미담당 상담 업데이트
const updateStmt = db.prepare(`
  UPDATE consults
  SET report_content = ?
  WHERE title = '학부모의 수업 방해 및 폭언'
  AND lawyer_id IS NULL
`);

const result = updateStmt.run(longContent);

console.log(`✅ ${result.changes}개의 상담 내용이 업데이트되었습니다.`);
console.log('\n📝 업데이트된 내용 (일부):');
console.log(longContent.substring(0, 200) + '...\n');
console.log(`전체 길이: ${longContent.length}자`);

db.close();