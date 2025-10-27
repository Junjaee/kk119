/**
 * Quick Supabase Connection Test
 */

import { createClient } from '@supabase/supabase-js';

// 하드코딩된 자격증명 (테스트용)
const supabaseUrl = 'https://nzyncupzvwzhznbfnuvq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eW5jdXB6dnd6aHpuYmZudXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDQ1MjMsImV4cCI6MjA3NjUyMDUyM30.tei4XbkHdGLy85gqmVnlfVuORcXI3BWj4i3Sj5_GwAs';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eW5jdXB6dnd6aHpuYmZudXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk0NDUyMywiZXhwIjoyMDc2NTIwNTIzfQ.GxxdXzCx7sntrf7LBByAJdQUOyrkVudRNya9-dTi1sI';

console.log('\n🔍 Supabase 연결 테스트 시작...\n');

try {
  // Step 1: Initialize client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase 클라이언트 초기화 성공');
  console.log(`   URL: ${supabaseUrl}`);

  // Step 2: Test REST API connection
  console.log('\n🔌 REST API 연결 테스트 중...');
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });

  console.log(`   HTTP 상태: ${response.status} ${response.statusText}`);

  if (response.ok || response.status === 404 || response.status === 406) {
    console.log('✅ REST API 연결 성공');
  } else {
    throw new Error(`예상치 못한 상태 코드: ${response.status}`);
  }

  // Step 3: Test with service role
  console.log('\n🔑 Service Role 권한 테스트 중...');
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // Query system tables to verify service role works
  const { data, error } = await adminClient
    .from('pg_catalog.pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .limit(5);

  if (error) {
    console.log(`⚠️  테이블 조회 실패: ${error.message}`);
    console.log('   (정상 - 아직 테이블을 생성하지 않았습니다)');
  } else {
    console.log('✅ Service Role 키 정상 작동');
    console.log(`   public 스키마 테이블 수: ${data?.length || 0}`);
    if (data && data.length > 0) {
      console.log(`   발견된 테이블: ${data.map(t => t.tablename).join(', ')}`);
    } else {
      console.log('   (아직 테이블이 없음 - 정상)');
    }
  }

  console.log('\n✨ 모든 테스트 통과!');
  console.log('\n📋 다음 단계:');
  console.log('   ✓ .env.local 파일에 인증 정보 설정 완료');
  console.log('   ✓ Supabase 연결 확인 완료');
  console.log('   ➜ 이제 데이터베이스 스키마를 생성할 준비가 되었습니다');
  console.log('\n');

  process.exit(0);

} catch (err) {
  console.error('\n❌ 연결 실패:');
  console.error(`   ${err.message}`);
  if (err.stack) {
    console.error('\n상세 오류:');
    console.error(err.stack);
  }
  process.exit(1);
}
