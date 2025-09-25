const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data', 'consult.db'));

try {
  // Find lawyer id 3 (박변호사)
  const lawyerStmt = db.prepare("SELECT id FROM lawyers WHERE name = ?");
  let lawyerId = lawyerStmt.get('박변호사')?.id;

  if (!lawyerId) {
    // Create lawyer if not exists
    const insertLawyer = db.prepare(`
      INSERT INTO lawyers (name, specialty, license_number, bio, years_of_experience)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insertLawyer.run(
      '박변호사',
      '민형사 전문',
      '2019-11111',
      '교육 현장의 민형사 문제를 전문으로 처리합니다.',
      5
    );
    lawyerId = result.lastInsertRowid;
  }

  // Update consult 3 to completed with lawyer response
  const updateConsult = db.prepare(`
    UPDATE consults
    SET status = 'completed',
        lawyer_id = ?,
        consult_content = ?,
        answered_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 3
  `);

  const response = `SNS 명예훼손에 대한 법적 대응 방안을 안내드립니다.

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

빠른 대응이 중요하므로 즉시 조치 취하시기 바랍니다.`;

  updateConsult.run(lawyerId, response);

  console.log('✅ Successfully updated consult 3 to completed status with lawyer response');

  // Verify the update
  const checkStmt = db.prepare("SELECT status, lawyer_id FROM consults WHERE id = 3");
  const result = checkStmt.get();
  console.log('Verification:', result);

} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}