import { Report, Post, Consult, User, Notification } from '@/lib/types';

// Mock Reports
export const mockReports: Report[] = [
  {
    id: '1',
    user_id: 'teacher-1',
    type: 'parent',
    title: '학부모 민원 관련 건',
    content: '학부모가 수업 방식에 대해 과도한 민원을 제기하며 협박성 발언을 했습니다. 녹음 파일이 있으며, 증인도 있는 상황입니다.',
    incident_date: '2025-08-25',
    status: 'consulting',
    created_at: '2025-08-27T10:00:00Z',
    updated_at: '2025-08-27T15:00:00Z'
  },
  {
    id: '2',
    user_id: 'teacher-1',
    type: 'student',
    title: '학생 폭언 사건',
    content: '수업 중 학생이 교사에게 욕설과 함께 위협적인 행동을 보였습니다. CCTV에 녹화되어 있습니다.',
    incident_date: '2025-08-24',
    status: 'completed',
    created_at: '2025-08-26T14:30:00Z',
    updated_at: '2025-08-27T10:00:00Z'
  },
  {
    id: '3',
    user_id: 'teacher-2',
    type: 'defamation',
    title: '온라인 명예훼손',
    content: 'SNS에서 허위 사실을 유포하며 명예를 훼손당했습니다. 스크린샷과 URL을 보관하고 있습니다.',
    incident_date: '2025-08-23',
    status: 'reviewing',
    created_at: '2025-08-25T09:15:00Z',
    updated_at: '2025-08-25T09:15:00Z'
  },
  {
    id: '4',
    user_id: 'teacher-3',
    type: 'other',
    title: '학교 행정 압박',
    content: '부당한 업무 지시와 함께 인사상 불이익을 암시받았습니다. 관련 문서와 이메일을 보관중입니다.',
    incident_date: '2025-08-22',
    status: 'received',
    created_at: '2025-08-24T16:45:00Z',
    updated_at: '2025-08-24T16:45:00Z'
  }
];

// Mock Posts
export const mockPosts: Post[] = [
  {
    id: '1',
    user_id: 'teacher-1',
    category: 'free',
    title: '효과적인 학부모 상담 방법 공유합니다',
    content: '오늘 있었던 학부모 상담에서 효과적이었던 대화법을 공유하려고 합니다. 먼저 감정적으로 대응하지 않고 차분하게 듣는 것이 중요했습니다. 학부모의 입장을 충분히 들어준 후, 객관적인 사실을 바탕으로 설명하니 이해하시더라고요.',
    view_count: 234,
    like_count: 42,
    created_at: '2025-08-27T14:00:00Z',
    updated_at: '2025-08-27T14:00:00Z'
  },
  {
    id: '2',
    user_id: 'teacher-2',
    category: 'case',
    title: '교권 침해 대응 경험 공유',
    content: '작년에 겪었던 교권 침해 사건과 대응 과정을 공유합니다. 법적 조치까지 갔던 경험이라 도움이 될 것 같아서 올립니다. 증거 수집이 가장 중요했고, 교육청과 교원단체의 도움을 받는 것이 큰 힘이 되었습니다.',
    view_count: 189,
    like_count: 38,
    created_at: '2025-08-27T10:30:00Z',
    updated_at: '2025-08-27T10:30:00Z'
  },
  {
    id: '3',
    user_id: 'teacher-3',
    category: 'free',
    title: '신규 교사입니다. 선배님들 조언 부탁드려요',
    content: '이제 막 발령받은 신규 교사입니다. 첫 학부모 상담을 앞두고 있는데 너무 떨립니다. 어떻게 준비하면 좋을까요? 특히 민원이 많은 학부모를 대할 때 주의할 점이 있다면 알려주세요.',
    view_count: 156,
    like_count: 25,
    created_at: '2025-08-26T16:20:00Z',
    updated_at: '2025-08-26T16:20:00Z'
  },
  {
    id: '4',
    user_id: 'lawyer-1',
    category: 'case',
    title: '[변호사 답변] 명예훼손 관련 법적 대응 가이드',
    content: '최근 명예훼손 관련 문의가 많아 정리해서 공유드립니다. 명예훼손죄의 성립 요건과 대응 방법에 대해 설명드리겠습니다. 먼저 형법상 명예훼손죄는...',
    view_count: 412,
    like_count: 78,
    created_at: '2025-08-26T09:00:00Z',
    updated_at: '2025-08-26T09:00:00Z'
  }
];

// Mock Consults
export const mockConsults: Consult[] = [
  {
    id: '1',
    report_id: '1',
    lawyer_id: 'lawyer-1',
    content: `안녕하세요, 교육법 전문 김변호사입니다.

먼저 선생님께서 겪으신 일에 대해 안타깝게 생각합니다. 제출해주신 내용을 검토한 결과, 다음과 같은 법적 대응이 가능합니다.

1. **형사적 대응**
   - 협박죄 (형법 제283조): 협박성 발언이 해악을 고지하는 수준이라면 협박죄 성립 가능
   - 모욕죄 (형법 제311조): 공연히 모욕적 발언을 한 경우 해당
   - 업무방해죄 (형법 제314조): 정당한 교육활동을 방해한 경우

2. **민사적 대응**
   - 정신적 손해배상청구: 정신적 고통에 대한 위자료 청구 가능
   - 가처분 신청: 추가적인 괴롭힘 방지를 위한 접근금지가처분

녹음 파일과 증인이 있다는 점은 매우 유리한 증거입니다. 추가적인 법적 조치를 원하시면 상세한 상담을 진행하겠습니다.`,
    created_at: '2025-08-27T15:00:00Z'
  },
  {
    id: '2',
    report_id: '2',
    lawyer_id: 'lawyer-2',
    content: `학생의 폭언과 위협적 행동에 대해서는 다음과 같이 대응하실 수 있습니다.

1. **학교 내 조치**
   - 학생생활지도위원회 개최
   - 선도위원회 징계 요청
   - 학부모 면담 및 서면 경고

2. **법적 조치**
   - 미성년자라도 형사책임능력이 있는 경우 (만 14세 이상) 고소 가능
   - 학부모에 대한 손해배상청구 (민법 제755조)

CCTV 증거가 있다는 점이 유리합니다. 상황의 심각성을 고려하여 단계적으로 대응하시기를 권합니다.`,
    created_at: '2025-08-26T10:00:00Z'
  }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    user_id: 'teacher-1',
    type: 'consult_reply',
    title: '신고 건에 변호사 답변이 등록되었습니다',
    content: '학부모 민원 관련 건에 대한 법률 자문이 등록되었습니다.',
    is_read: false,
    created_at: '2025-08-27T15:00:00Z'
  },
  {
    id: '2',
    user_id: 'teacher-1',
    type: 'comment',
    title: '작성하신 글에 댓글이 달렸습니다',
    content: '효과적인 학부모 상담 방법 공유합니다 글에 새로운 댓글이 있습니다.',
    is_read: false,
    created_at: '2025-08-27T16:30:00Z'
  },
  {
    id: '3',
    user_id: 'teacher-1',
    type: 'announcement',
    title: '시스템 공지사항',
    content: '9월 1일 시스템 정기 점검이 예정되어 있습니다.',
    is_read: true,
    created_at: '2025-08-26T09:00:00Z'
  }
];

// Mock Statistics
export const mockStatistics = {
  totalReports: mockReports.length,
  pendingReports: mockReports.filter(r => r.status === 'received' || r.status === 'reviewing').length,
  completedReports: mockReports.filter(r => r.status === 'completed').length,
  totalUsers: 234,
  totalLawyers: 12,
  dailyReports: 8,
  completionRate: 0.86,
  averageResponseTime: 22 // hours
};