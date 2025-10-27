/**
 * Verify RLS (Row Level Security) Policies
 *
 * Supabase에 RLS 정책이 올바르게 적용되었는지 확인
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nzyncupzvwzhznbfnuvq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eW5jdXB6dnd6aHpuYmZudXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk0NDUyMywiZXhwIjoyMDc2NTIwNTIzfQ.GxxdXzCx7sntrf7LBByAJdQUOyrkVudRNya9-dTi1sI';

console.log('\n🔒 RLS 정책 검증 시작...\n');

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

  // Check RLS status for each table
  console.log('📋 테이블별 RLS 활성화 상태 확인:\n');

  const rlsResults = [];

  for (const tableName of expectedTables) {
    try {
      // Query pg_tables to check RLS status
      const { data, error } = await supabase.rpc('check_rls_status', {
        table_name: tableName
      }).single();

      if (error) {
        // Fallback: Try direct query to information schema
        const { data: rlsData, error: rlsError } = await supabase
          .from('pg_tables')
          .select('rowsecurity')
          .eq('schemaname', 'public')
          .eq('tablename', tableName)
          .single();

        if (!rlsError && rlsData) {
          rlsResults.push({
            table: tableName,
            rls_enabled: rlsData.rowsecurity,
            status: rlsData.rowsecurity ? '✅' : '❌'
          });
        } else {
          rlsResults.push({
            table: tableName,
            rls_enabled: null,
            status: '⚠️'
          });
        }
      } else {
        rlsResults.push({
          table: tableName,
          rls_enabled: data,
          status: data ? '✅' : '❌'
        });
      }
    } catch (err) {
      rlsResults.push({
        table: tableName,
        rls_enabled: null,
        status: '⚠️',
        error: err.message
      });
    }
  }

  // Display results
  rlsResults.forEach(result => {
    console.log(`  ${result.status} ${result.table.padEnd(30)} - RLS ${result.rls_enabled ? 'ENABLED' : result.rls_enabled === null ? 'UNKNOWN' : 'DISABLED'}`);
    if (result.error) {
      console.log(`     └─ Error: ${result.error}`);
    }
  });

  const enabledCount = rlsResults.filter(r => r.rls_enabled === true).length;
  const disabledCount = rlsResults.filter(r => r.rls_enabled === false).length;
  const unknownCount = rlsResults.filter(r => r.rls_enabled === null).length;

  console.log(`\n📊 RLS 활성화 상태 요약:`);
  console.log(`   ✅ 활성화: ${enabledCount}/${expectedTables.length}개`);
  if (disabledCount > 0) {
    console.log(`   ❌ 비활성화: ${disabledCount}개`);
  }
  if (unknownCount > 0) {
    console.log(`   ⚠️  확인 불가: ${unknownCount}개`);
  }

  // Check RLS policies count
  console.log('\n🔍 RLS 정책 개수 확인 중...\n');

  try {
    // Note: This requires access to pg_policies view
    // May need to create a custom function in Supabase for this
    console.log('   ℹ️  RLS 정책 개수는 Supabase 대시보드에서 확인하세요:');
    console.log('   https://supabase.com/dashboard/project/nzyncupzvwzhznbfnuvq/auth/policies');
  } catch (err) {
    console.log(`   ⚠️  정책 개수 확인 실패: ${err.message}`);
  }

  console.log('\n✨ RLS 검증 완료!\n');

  if (enabledCount === expectedTables.length) {
    console.log('🎉 모든 테이블에 RLS가 활성화되었습니다!\n');
    console.log('📋 다음 단계:');
    console.log('   1. Supabase SQL Editor에서 003_enable_rls.sql 실행');
    console.log('   2. Supabase 대시보드에서 정책 확인');
    console.log('   3. 역할별 접근 권한 테스트\n');
    process.exit(0);
  } else {
    console.log('⚠️  일부 테이블에 RLS가 활성화되지 않았습니다.');
    console.log('   Supabase SQL Editor에서 003_enable_rls.sql을 실행해주세요.\n');
    process.exit(1);
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
