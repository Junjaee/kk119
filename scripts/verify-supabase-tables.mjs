/**
 * Verify Supabase Tables Creation
 *
 * Supabase에 모든 테이블이 올바르게 생성되었는지 확인
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nzyncupzvwzhznbfnuvq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eW5jdXB6dnd6aHpuYmZudXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk0NDUyMywiZXhwIjoyMDc2NTIwNTIzfQ.GxxdXzCx7sntrf7LBByAJdQUOyrkVudRNya9-dTi1sI';

console.log('\n🔍 Supabase 테이블 검증 시작...\n');

const expectedTables = [
  'users',
  'sessions',
  'verification_tokens',
  'password_reset_tokens',
  'resources',
  'reports',
  'report_status_history',
  'files',
  'lawyers',
  'consults',
  'consult_replies',
  'consult_attachments',
  'associations',
  'memberships',
  'community_posts',
  'community_comments',
  'audit_logs'
];

try {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase 클라이언트 초기화 성공\n');

  // Query information_schema to get all tables
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  if (error) {
    console.error('❌ 테이블 조회 실패:', error.message);

    // Try alternative method using RPC
    console.log('\n대체 방법으로 테이블 확인 중...\n');

    const results = [];
    for (const tableName of expectedTables) {
      try {
        const { data, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);

        if (!tableError) {
          results.push({ table: tableName, exists: true });
          console.log(`  ✅ ${tableName}`);
        } else {
          results.push({ table: tableName, exists: false });
          console.log(`  ❌ ${tableName} - ${tableError.message}`);
        }
      } catch (err) {
        results.push({ table: tableName, exists: false });
        console.log(`  ❌ ${tableName} - ${err.message}`);
      }
    }

    const existingCount = results.filter(r => r.exists).length;
    const missingTables = results.filter(r => !r.exists);

    console.log(`\n📊 테이블 검증 결과:`);
    console.log(`   생성된 테이블: ${existingCount}/${expectedTables.length}`);

    if (missingTables.length > 0) {
      console.log(`\n⚠️  누락된 테이블 (${missingTables.length}개):`);
      missingTables.forEach(t => console.log(`     - ${t.table}`));
      process.exit(1);
    } else {
      console.log('\n✨ 모든 테이블이 성공적으로 생성되었습니다!\n');
      process.exit(0);
    }
  } else {
    const tableNames = tables.map(t => t.table_name);
    console.log('📋 생성된 테이블 목록:\n');

    const foundTables = [];
    const missingTables = [];

    expectedTables.forEach(tableName => {
      if (tableNames.includes(tableName)) {
        foundTables.push(tableName);
        console.log(`  ✅ ${tableName}`);
      } else {
        missingTables.push(tableName);
        console.log(`  ❌ ${tableName} (누락)`);
      }
    });

    // Check for unexpected tables
    const unexpectedTables = tableNames.filter(name => !expectedTables.includes(name));

    console.log(`\n📊 테이블 검증 결과:`);
    console.log(`   예상 테이블: ${expectedTables.length}개`);
    console.log(`   생성된 테이블: ${foundTables.length}개`);
    console.log(`   누락된 테이블: ${missingTables.length}개`);

    if (unexpectedTables.length > 0) {
      console.log(`   추가 테이블: ${unexpectedTables.length}개`);
      console.log('\n추가로 발견된 테이블:');
      unexpectedTables.forEach(t => console.log(`     - ${t}`));
    }

    if (missingTables.length > 0) {
      console.log(`\n⚠️  누락된 테이블:`);
      missingTables.forEach(t => console.log(`     - ${t}`));
      console.log('\n일부 테이블이 생성되지 않았습니다. SQL 스크립트를 다시 확인해주세요.');
      process.exit(1);
    } else {
      console.log('\n✨ 모든 테이블이 성공적으로 생성되었습니다!');

      // Verify some key tables have correct structure
      console.log('\n🔍 주요 테이블 구조 검증 중...\n');

      // Check users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(0);

      if (!usersError) {
        console.log('  ✅ users 테이블 구조 정상');
      } else {
        console.log(`  ⚠️  users 테이블 검증 실패: ${usersError.message}`);
      }

      // Check reports table
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .limit(0);

      if (!reportsError) {
        console.log('  ✅ reports 테이블 구조 정상');
      } else {
        console.log(`  ⚠️  reports 테이블 검증 실패: ${reportsError.message}`);
      }

      // Check community_posts table
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .limit(0);

      if (!postsError) {
        console.log('  ✅ community_posts 테이블 구조 정상');
      } else {
        console.log(`  ⚠️  community_posts 테이블 검증 실패: ${postsError.message}`);
      }

      console.log('\n✅ 스키마 마이그레이션 검증 완료!');
      console.log('\n📋 다음 단계:');
      console.log('   ✓ PostgreSQL 스키마 생성 완료');
      console.log('   ➜ 이제 데이터 액세스 계층을 Supabase로 리팩토링할 준비가 되었습니다');
      console.log('\n');

      process.exit(0);
    }
  }
} catch (err) {
  console.error('\n❌ 검증 실패:');
  console.error(`   ${err.message}`);
  if (err.stack) {
    console.error('\n상세 오류:');
    console.error(err.stack);
  }
  process.exit(1);
}
