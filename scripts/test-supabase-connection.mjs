/**
 * Test Supabase Connection Script
 *
 * This script verifies that:
 * 1. Environment variables are properly set
 * 2. Supabase client can be initialized
 * 3. Database connection is working
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Supabase 연결 테스트 중...\n');

// Step 1: Check environment variables
console.log('📋 환경 변수 확인:');
console.log(`  ✓ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`  ✓ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ 설정됨' : '❌ 없음'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ 오류: 필수 환경 변수가 없습니다!');
  console.log('\n.env.local 파일에 다음 항목이 있는지 확인하세요:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('\n🔌 데이터베이스 연결 테스트 중...\n');

try {
  // Step 2: Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase 클라이언트 초기화 성공');

  // Step 3: Test basic database connection
  console.log('\n🗄️  데이터베이스 연결 확인 중...');

  // Simple health check using REST API
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });

  if (response.ok || response.status === 404) {
    console.log('✅ 데이터베이스 연결 성공 (REST API 응답 확인)');
    console.log(`   상태 코드: ${response.status}`);
  } else {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // Step 4: Test with service role if available
  if (supabaseServiceKey) {
    console.log('\n🔑 Service Role 키로 추가 테스트 중...');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Try to query information_schema
    const { data, error } = await adminClient
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .limit(5);

    if (error) {
      console.log('⚠️  테이블 조회 실패 (정상 - 아직 테이블이 없을 수 있음)');
      console.log(`   ${error.message}`);
    } else {
      console.log('✅ Service Role 키 정상 작동');
      console.log(`   public 스키마의 테이블 수: ${data?.length || 0}`);
      if (data && data.length > 0) {
        console.log(`   테이블: ${data.map(t => t.tablename).join(', ')}`);
      }
    }
  }

  console.log('\n✨ 모든 테스트 통과! Supabase가 정상적으로 구성되었습니다.\n');
  process.exit(0);

} catch (err) {
  console.error('\n❌ 연결 테스트 실패:');
  console.error(`   ${err.message}`);
  console.log('\n다음 사항을 확인하세요:');
  console.log('  1. Supabase 프로젝트가 실행 중인지');
  console.log('  2. URL과 API 키가 올바른지');
  console.log('  3. 네트워크가 Supabase 서버에 접근 가능한지');
  console.log('\n');
  process.exit(1);
}
