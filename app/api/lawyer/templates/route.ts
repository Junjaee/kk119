import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// 템플릿 타입 정의
interface ConsultationTemplate {
  id: string;
  category: string;
  subcategory: string;
  title: string;
  description: string;
  content: string;
  recommended_actions: string;
  legal_references?: string;
  usage_notes?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// 변호사 권한 검증 및 사용자 정보 조회 함수
async function checkLawyerPermission(req: NextRequest) {
  const supabase = createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { authorized: false, error: '인증이 필요합니다.', user: null };
    }

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role, email, name, is_verified, specialization, law_firm')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { authorized: false, error: '사용자 정보를 찾을 수 없습니다.', user: null };
    }

    // 변호사 권한 확인
    if (profile.role !== 'lawyer') {
      return { authorized: false, error: '변호사 권한이 필요합니다.', user: null };
    }

    // 인증된 변호사인지 확인
    if (!profile.is_verified) {
      return { authorized: false, error: '인증되지 않은 변호사입니다.', user: null };
    }

    return { authorized: true, user: profile };
  } catch (error) {
    console.error('Lawyer permission check error:', error);
    return { authorized: false, error: '권한 확인 중 오류가 발생했습니다.', user: null };
  }
}

// 하드코딩된 상담 템플릿 데이터
function getConsultationTemplates(): ConsultationTemplate[] {
  const now = new Date().toISOString();

  return [
    // 괴롭힘/따돌림 관련 템플릿
    {
      id: 'template-bullying-001',
      category: '괴롭힘/따돌림',
      subcategory: '언어폭력',
      title: '언어폭력 피해 상담 응답',
      description: '언어폭력을 당한 피해자에 대한 법적 조언 템플릿',
      content: `안녕하세요. 귀하의 신고를 검토한 결과, 언어폭력에 해당하는 심각한 상황으로 판단됩니다.

**법적 검토 의견:**
- 모욕죄(형법 제311조): 공연히 사람을 모욕한 경우 성립 가능
- 명예훼손죄(형법 제307조): 사실 적시하여 명예를 훼손한 경우 성립 가능
- 민사상 손해배상 청구(민법 제751조): 정신적 피해에 대한 위자료 청구 가능

**현재 상황에서의 대응 방안:**
1. 증거자료 보전 (대화 내용 캡처, 녹음파일 등)
2. 목격자 진술 확보
3. 피해 사실에 대한 상세한 기록 작성

**추가적인 보호 조치:**
- 가해자와의 접촉 차단 조치 요청
- 심리적 지원 서비스 연계
- 추가 피해 발생 시 즉시 신고 체계 구축`,
      recommended_actions: `1. 증거자료 수집 및 보전
2. 피해 일지 작성
3. 관련 기관 신고 검토
4. 민사소송 가능성 검토
5. 정신건강 상담 서비스 이용`,
      legal_references: '형법 제311조(모욕), 형법 제307조(명예훼손), 민법 제751조(불법행위로 인한 손해배상)',
      usage_notes: '피해자의 심리적 상태를 고려하여 따뜻하고 지지적인 톤으로 작성',
      tags: ['언어폭력', '괴롭힘', '모욕죄', '명예훼손', '위자료'],
      created_at: now,
      updated_at: now
    },
    {
      id: 'template-bullying-002',
      category: '괴롭힘/따돌림',
      subcategory: '집단따돌림',
      title: '집단따돌림 피해 상담 응답',
      description: '집단에서 따돌림을 당한 피해자에 대한 법적 조언 템플릿',
      content: `귀하께서 겪으신 집단따돌림 상황에 대해 법적 검토를 완료했습니다.

**법적 분석:**
- 집단따돌림은 다수의 가해자가 관련되어 복합적인 법적 문제를 야기합니다
- 개별 가해행위에 대한 책임과 집단 책임을 구분하여 접근해야 합니다
- 조직적 괴롭힘의 경우 더 엄중한 법적 조치 가능합니다

**적용 가능한 법률:**
- 개별 가해행위: 모욕죄, 명예훼손죄, 폭행죄 등
- 집단행위: 공동불법행위(민법 제760조)
- 기관 책임: 안전보호의무 위반

**권장 대응 절차:**
1. 집단따돌림 패턴 분석 및 문서화
2. 주동자와 추종자 구분
3. 각 개인별 가해행위 특정
4. 기관의 대응 의무 이행 여부 검토`,
      recommended_actions: `1. 따돌림 경위 및 참여자 명단 작성
2. 각 가해행위별 증거 수집
3. 기관 신고 및 보호조치 요청
4. 법률상담을 통한 구체적 대응방안 수립
5. 정신건강 전문가 상담 병행`,
      legal_references: '민법 제760조(공동불법행위), 형법 각 해당 조문',
      usage_notes: '집단 가해의 복잡성을 설명하되, 해결 가능성에 대한 희망을 제시',
      tags: ['집단따돌림', '공동불법행위', '조직적괴롭힘', '안전보호의무'],
      created_at: now,
      updated_at: now
    },

    // 성희롱/성폭력 관련 템플릿
    {
      id: 'template-sexual-001',
      category: '성희롱/성폭력',
      subcategory: '성희롱',
      title: '성희롱 피해 상담 응답',
      description: '성희롱 피해자에 대한 법적 조언 및 대응방안 템플릿',
      content: `성희롱 피해 신고에 대해 신중하게 검토하였습니다.

**법적 근거 및 보호 체계:**
- 성폭력범죄의 처벌 등에 관한 특례법
- 남녀고용평등과 일·가정 양립 지원에 관한 법률
- 양성평등기본법

**성희롱의 법적 정의:**
- 업무, 고용, 교육 관계에서 지위를 이용한 성적 언동
- 성적 굴욕감이나 혐오감을 느끼게 하는 행위
- 성적 언동에 대한 불응을 이유로 한 불이익 조치

**즉시 취할 수 있는 조치:**
1. 피해 상황 즉시 기록 (일시, 장소, 구체적 내용, 목격자)
2. 증거자료 보전 (메시지, 이메일, 음성녹음 등)
3. 신뢰할 만한 사람에게 피해 사실 알리기
4. 전문상담기관 연락

**보호 및 구제 절차:**
- 기관 내 고충처리 신청
- 국가인권위원회 진정
- 고용노동부 신고 (직장 내 성희롱)
- 수사기관 신고 고려`,
      recommended_actions: `1. 즉시 피해 기록 작성
2. 전문상담기관 상담 예약
3. 신뢰할 수 있는 지원자 확보
4. 2차 피해 방지 조치 요청
5. 법적 대응 방안 구체적 상담`,
      legal_references: '성폭력범죄의 처벌 등에 관한 특례법, 남녀고용평등법, 양성평등기본법',
      usage_notes: '피해자 중심 접근, 2차 피해 방지 강조, 비밀보장 원칙 준수',
      tags: ['성희롱', '성폭력특례법', '남녀고용평등법', '2차피해방지'],
      created_at: now,
      updated_at: now
    },

    // 폭력/폭행 관련 템플릿
    {
      id: 'template-violence-001',
      category: '폭력/폭행',
      subcategory: '신체폭행',
      title: '신체폭행 피해 상담 응답',
      description: '신체적 폭행 피해자에 대한 법적 조언 템플릿',
      content: `신체폭행 피해에 대한 법적 검토 결과를 알려드립니다.

**형사법적 검토:**
- 폭행죄(형법 제260조): 사람의 신체에 대한 유형력 행사
- 상해죄(형법 제257조): 상해 결과가 발생한 경우
- 특수폭행/특수상해: 위험한 물건 사용시

**상해 정도에 따른 법정형:**
- 단순폭행: 2년 이하 징역, 500만원 이하 벌금
- 단순상해: 7년 이하 징역, 10년 이하 자격정지, 1천만원 이하 벌금
- 중상해: 1년 이상 10년 이하 징역

**즉시 조치사항:**
1. 의료진 진료 및 진단서 발급
2. 상해 부위 사진 촬영 (날짜 포함)
3. 112 신고 및 현장 보전
4. 목격자 연락처 확보

**민사상 손해배상:**
- 치료비, 위자료, 휴업손해 등 청구 가능
- 합의 시에도 민사책임은 별개임을 유의`,
      recommended_actions: `1. 즉시 병원 진료 및 진단서 발급
2. 경찰서 신고 및 피해신고 접수
3. 증거자료 수집 및 보전
4. 민사손해배상 청구 검토
5. 피해자 지원기관 연계`,
      legal_references: '형법 제257조(상해), 형법 제260조(폭행), 민법 제751조(불법행위)',
      usage_notes: '즉시 의료조치의 중요성 강조, 증거보전의 시급성 설명',
      tags: ['폭행', '상해', '신체폭력', '진단서', '손해배상'],
      created_at: now,
      updated_at: now
    },

    // 사이버폭력 관련 템플릿
    {
      id: 'template-cyber-001',
      category: '사이버폭력',
      subcategory: '온라인괴롭힘',
      title: '온라인 괴롭힘 피해 상담 응답',
      description: '인터넷상에서의 괴롭힘 피해자에 대한 법적 조언 템플릿',
      content: `온라인 괴롭힘 피해에 대한 법적 분석 결과입니다.

**적용 가능한 법률:**
- 정보통신망 이용촉진 및 정보보호 등에 관한 법률
- 모욕죄, 명예훼손죄 (형법)
- 스토킹처벌법 (지속적 괴롭힘의 경우)

**온라인 괴롭힘의 특징:**
- 익명성을 이용한 지속적 가해
- 다수의 사람에게 노출되는 공개적 성격
- 디지털 증거의 보전 가능성
- 24시간 지속되는 피해

**즉시 대응 방안:**
1. 가해 게시물 스크린샷 저장 (날짜, 시간 포함)
2. 플랫폼 신고 기능 이용
3. 차단 및 필터링 설정
4. IP 추적을 위한 수사기관 신고

**디지털 증거 보전:**
- 전체 화면 캡처 (주소창, 시간 포함)
- 동영상 녹화 방법 활용
- 공증을 통한 증거능력 강화 고려`,
      recommended_actions: `1. 즉시 증거자료 수집 및 보전
2. 플랫폼 신고 및 게시물 삭제 요청
3. 사이버수사대 신고 검토
4. 디지털 포렌식 전문가 상담
5. 정신건강 지원 서비스 연계`,
      legal_references: '정보통신망법, 형법 제307조, 제311조, 스토킹처벌법',
      usage_notes: '디지털 증거의 특성과 보전방법에 대한 구체적 안내 필요',
      tags: ['사이버폭력', '온라인괴롭힘', '정보통신망법', '디지털증거'],
      created_at: now,
      updated_at: now
    },

    // 차별/혐오 관련 템플릿
    {
      id: 'template-discrimination-001',
      category: '차별/혐오',
      subcategory: '성차별',
      title: '성차별 피해 상담 응답',
      description: '성별에 따른 차별 피해자에 대한 법적 조언 템플릿',
      content: `성차별 피해에 대한 법적 검토를 완료하였습니다.

**관련 법률 체계:**
- 양성평등기본법
- 남녀고용평등과 일·가정 양립 지원에 관한 법률
- 교육기본법 (교육 분야)
- 국가인권위원회법

**성차별의 유형:**
1. 직접차별: 성별을 이유로 한 불리한 대우
2. 간접차별: 중립적 기준이지만 특정 성별에게 불리한 결과
3. 괴롭힘: 성별을 이유로 한 적대적 환경 조성

**구제 절차:**
- 국가인권위원회 진정
- 고용노동부 신고 (직장 관련)
- 교육부 신고 (교육기관 관련)
- 민사소송을 통한 손해배상

**입증 책임의 전환:**
차별의 개연성이 인정되면 상대방이 차별이 아님을 입증해야 합니다.`,
      recommended_actions: `1. 차별 행위의 구체적 기록 작성
2. 비교대상자 확인 및 차별 입증자료 수집
3. 국가인권위원회 진정 검토
4. 관련 기관 신고 및 구제신청
5. 전문기관 상담 및 지원 요청`,
      legal_references: '양성평등기본법, 남녀고용평등법, 국가인권위원회법',
      usage_notes: '입증책임 전환의 의미와 차별판단 기준에 대한 명확한 설명 필요',
      tags: ['성차별', '양성평등', '직접차별', '간접차별', '인권위진정'],
      created_at: now,
      updated_at: now
    },

    // 기타 일반적인 템플릿
    {
      id: 'template-general-001',
      category: '기타',
      subcategory: '일반상담',
      title: '일반 사건 초기 상담 응답',
      description: '구체적 사안 분류 전 일반적인 초기 상담 템플릿',
      content: `귀하의 신고 사안을 검토하였으며, 다음과 같은 법적 검토 의견을 제시합니다.

**초기 법적 분석:**
신고하신 내용을 바탕으로 관련 법령 및 판례를 검토한 결과, 다음과 같은 법적 쟁점들이 확인됩니다.

**권리구제 방안:**
1. 행정적 구제: 관련 기관 신고 및 조사 요청
2. 사법적 구제: 민사소송, 형사고발 등 검토
3. 준사법적 구제: 인권위원회 등 전문기관 활용

**추가 확인 필요사항:**
구체적인 법적 조언을 위해 다음 사항들에 대한 추가 정보가 필요합니다.

**당면한 조치사항:**
긴급한 보호나 증거보전이 필요한 상황인지 판단하여 우선 조치사항을 안내합니다.

**장기적 해결방안:**
근본적이고 항구적인 문제 해결을 위한 단계별 접근 방안을 제시합니다.`,
      recommended_actions: `1. 사실관계 정리 및 시간순 기록 작성
2. 관련 증거자료 수집 및 보전
3. 전문기관 상담 예약
4. 긴급보호조치 필요성 검토
5. 단계별 대응계획 수립`,
      legal_references: '사안별 해당 법령 적용',
      usage_notes: '구체적 사실관계 확인 후 맞춤형 조언 제공 필요',
      tags: ['일반상담', '초기검토', '권리구제', '사실관계정리'],
      created_at: now,
      updated_at: now
    }
  ];
}

// GET: 변호사 상담 템플릿 목록 조회
export async function GET(req: NextRequest) {
  // 권한 검증
  const permissionCheck = await checkLawyerPermission(req);
  if (!permissionCheck.authorized || !permissionCheck.user) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  const lawyer = permissionCheck.user;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);

    // 템플릿 데이터 가져오기
    let templates = getConsultationTemplates();

    // 카테고리 필터링
    if (category) {
      templates = templates.filter(template =>
        template.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // 하위카테고리 필터링
    if (subcategory) {
      templates = templates.filter(template =>
        template.subcategory.toLowerCase().includes(subcategory.toLowerCase())
      );
    }

    // 검색어 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      templates = templates.filter(template =>
        template.title.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.content.toLowerCase().includes(searchLower)
      );
    }

    // 태그 필터링
    if (tags && tags.length > 0) {
      templates = templates.filter(template =>
        tags.some(tag =>
          template.tags.some(templateTag =>
            templateTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    // 카테고리별 통계 생성
    const categories = templates.reduce((acc, template) => {
      const category = template.category;
      if (!acc[category]) {
        acc[category] = {
          name: category,
          count: 0,
          subcategories: {}
        };
      }
      acc[category].count++;

      const subcategory = template.subcategory;
      if (!acc[category].subcategories[subcategory]) {
        acc[category].subcategories[subcategory] = {
          name: subcategory,
          count: 0
        };
      }
      acc[category].subcategories[subcategory].count++;

      return acc;
    }, {} as Record<string, any>);

    // 자주 사용되는 태그 통계
    const tagStats = templates.reduce((acc, template) => {
      template.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const popularTags = Object.entries(tagStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    return NextResponse.json({
      templates,
      statistics: {
        total_templates: templates.length,
        categories: Object.values(categories).map(cat => ({
          name: cat.name,
          count: cat.count,
          subcategories: Object.values(cat.subcategories)
        })),
        popular_tags: popularTags
      },
      filters_applied: {
        category,
        subcategory,
        search,
        tags
      },
      lawyer_info: {
        id: lawyer.id,
        name: lawyer.name,
        specialization: lawyer.specialization,
        law_firm: lawyer.law_firm
      }
    });

  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}