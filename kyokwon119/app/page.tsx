'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { 
  FileText, 
  MessageSquare, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Shield,
  Plus,
  Activity,
  Target,
  Award,
  Sparkles,
  BookOpen,
  Phone,
  Calendar,
  Star,
  Heart,
  MessageCircle,
  BarChart3,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/date';

// Enhanced mock data
const recentReports = [
  {
    id: '1',
    title: '학부모 민원 관련 건',
    status: 'consulting',
    created_at: '2025-08-27T10:00:00Z',
    type: 'parent',
    priority: 'high'
  },
  {
    id: '2',
    title: '학생 폭언 사건',
    status: 'completed',
    created_at: '2025-08-26T14:30:00Z',
    type: 'student',
    priority: 'medium'
  },
  {
    id: '3',
    title: '동료 교사 갈등',
    status: 'reviewing',
    created_at: '2025-08-25T09:15:00Z',
    type: 'colleague',
    priority: 'low'
  }
];

const recentConsults = [
  {
    id: '1',
    title: '명예훼손 대응 방법',
    lawyer: '김변호사',
    created_at: '2025-08-27T15:00:00Z',
    status: 'answered'
  },
  {
    id: '2',
    title: '체벌 관련 법적 문제',
    lawyer: '이변호사',
    created_at: '2025-08-26T11:30:00Z',
    status: 'pending'
  }
];

const popularPosts = [
  {
    id: '1',
    title: '효과적인 학부모 상담 방법',
    author: '익명교사001',
    likes: 42,
    comments: 15,
    category: 'tip'
  },
  {
    id: '2',
    title: '교권 침해 대응 경험 공유',
    author: '익명교사002',
    likes: 38,
    comments: 12,
    category: 'experience'
  },
  {
    id: '3',
    title: '스트레스 관리 노하우',
    author: '익명교사003',
    likes: 26,
    comments: 8,
    category: 'wellness'
  }
];

const upcomingEvents = [
  {
    id: '1',
    title: '교권보호 온라인 세미나',
    date: '2025-08-30',
    time: '14:00',
    type: 'seminar'
  },
  {
    id: '2',
    title: '변호사 1:1 상담',
    date: '2025-08-31',
    time: '10:30',
    type: 'consultation'
  }
];

export default function HomePage() {
  const { user } = useStore();
  
  const getStatusBadgeClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      received: 'status-received',
      reviewing: 'status-reviewing',
      consulting: 'status-consulting',
      completed: 'status-completed',
    };
    
    return statusClasses[status] || 'status-received';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      received: '접수완료',
      reviewing: '검토중',
      consulting: '상담진행',
      completed: '해결완료',
    };
    
    return labels[status] || status;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-3 w-3 text-urgent-500" />;
      case 'medium': return <Clock className="h-3 w-3 text-yellow-500" />;
      default: return <Activity className="h-3 w-3 text-green-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Enhanced Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 via-white to-protection-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8 border border-border/40">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  안녕하세요, <span className="gradient-text">{user?.nickname || '선생님'}</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-4">
                  교권119가 선생님의 권리를 지켜드립니다
                </p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-protection-600" />
                    <span>안전하게 보호됩니다</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-primary-600" />
                    <span>24시간 지원</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-trust-600" />
                    <span>전문가 상담</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center animate-float">
                  <Shield className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-200/20 to-protection-200/20 rounded-full -translate-y-32 translate-x-32" />
        </div>

        {/* Enhanced Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/reports/new">
            <div className="card-modern card-urgent hover:scale-105 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-urgent-100 dark:bg-urgent-950/50 group-hover:bg-urgent-200 dark:group-hover:bg-urgent-900/50 transition-colors">
                    <Plus className="h-6 w-6 text-urgent-600 dark:text-urgent-400" />
                  </div>
                  <div className="badge-urgent-modern">긴급</div>
                </div>
                <CardTitle className="text-lg">신고 접수</CardTitle>
                <CardDescription>교권 침해를 즉시 신고하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  24시간 안전 신고 서비스
                </p>
              </CardContent>
            </div>
          </Link>

          <Link href="/consult">
            <div className="card-modern card-protection hover:scale-105 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-protection-100 dark:bg-protection-950/50 group-hover:bg-protection-200 dark:group-hover:bg-protection-900/50 transition-colors">
                    <MessageSquare className="h-6 w-6 text-protection-600 dark:text-protection-400" />
                  </div>
                  <div className="badge-protection-modern">전문</div>
                </div>
                <CardTitle className="text-lg">법률 상담</CardTitle>
                <CardDescription>전문 변호사 상담 서비스</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  무료 법률 전문 상담
                </p>
              </CardContent>
            </div>
          </Link>

          <Link href="/community">
            <div className="card-modern card-trust hover:scale-105 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-trust-100 dark:bg-trust-950/50 group-hover:bg-trust-200 dark:group-hover:bg-trust-900/50 transition-colors">
                    <Users className="h-6 w-6 text-trust-600 dark:text-trust-400" />
                  </div>
                  <div className="badge-trust-modern">HOT</div>
                </div>
                <CardTitle className="text-lg">커뮤니티</CardTitle>
                <CardDescription>동료 교사들과 소통하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  경험 공유 및 상호 지원
                </p>
              </CardContent>
            </div>
          </Link>

          <Link href="/reports">
            <div className="card-modern hover:scale-105 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-950/50 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                    <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="badge-primary-modern">3건</div>
                </div>
                <CardTitle className="text-lg">내 신고</CardTitle>
                <CardDescription>신고 처리 현황을 확인하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  실시간 진행 상황 추적
                </p>
              </CardContent>
            </div>
          </Link>
        </div>

        {/* Enhanced Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Reports - Enhanced */}
          <div className="lg:col-span-1">
            <div className="card-modern">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-primary-600" />
                    <CardTitle>최근 신고 현황</CardTitle>
                  </div>
                  <Link href="/reports">
                    <Button variant="ghost" size="sm" className="text-xs">
                      전체보기 <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-start justify-between p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(report.priority)}
                          <p className="text-sm font-medium">{report.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(report.created_at)}
                        </p>
                      </div>
                      <div className={`${getStatusBadgeClass(report.status)} text-xs`}>
                        {getStatusLabel(report.status)}
                      </div>
                    </div>
                  ))}
                  {recentReports.length === 0 && (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">신고 내역이 없습니다</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </div>

          {/* Recent Consults & Events */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recent Consults */}
            <div className="card-modern">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-protection-600" />
                    <CardTitle>변호사 상담</CardTitle>
                  </div>
                  <Link href="/consult">
                    <Button variant="ghost" size="sm" className="text-xs">
                      전체보기 <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentConsults.map((consult) => (
                    <div key={consult.id} className="p-3 rounded-xl bg-protection-50/50 dark:bg-protection-950/20 border border-protection-200/50 dark:border-protection-800/50">
                      <p className="text-sm font-medium">{consult.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {consult.lawyer} · {formatRelativeTime(consult.created_at)}
                        </p>
                        <div className={`badge-${consult.status === 'answered' ? 'trust-modern' : 'warning-modern'} text-xs`}>
                          {consult.status === 'answered' ? '답변완료' : '대기중'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>

            {/* Upcoming Events */}
            <div className="card-modern">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary-600" />
                  <CardTitle>예정된 일정</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="p-3 rounded-xl bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200/50 dark:border-primary-800/50">
                      <p className="text-sm font-medium">{event.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {event.date} · {event.time}
                        </p>
                        <div className="badge-primary-modern text-xs">
                          {event.type === 'seminar' ? '세미나' : '상담'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          </div>

          {/* Popular Posts */}
          <div className="lg:col-span-1">
            <div className="card-modern">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-trust-600" />
                    <CardTitle>인기 커뮤니티 글</CardTitle>
                  </div>
                  <Link href="/community">
                    <Button variant="ghost" size="sm" className="text-xs">
                      전체보기 <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularPosts.map((post) => (
                    <div key={post.id} className="p-3 rounded-xl bg-trust-50/50 dark:bg-trust-950/20 border border-trust-200/50 dark:border-trust-800/50 hover:bg-trust-100/50 dark:hover:bg-trust-900/30 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium flex-1">{post.title}</p>
                        <div className="badge-trust-modern text-xs ml-2">
                          {post.category === 'tip' ? '팁' : post.category === 'experience' ? '경험' : '건강'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{post.author}</span>
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Heart className="h-3 w-3 text-red-500" />
                            <span>{post.likes}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageCircle className="h-3 w-3 text-blue-500" />
                            <span>{post.comments}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="card-modern group hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 신고</CardTitle>
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-950/50 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                <BarChart3 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">12</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-trust-500 mr-1" />
                <span>+2 이번 달</span>
              </div>
            </CardContent>
          </div>

          <div className="card-modern group hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행중</CardTitle>
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950/50 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">3</div>
              <p className="text-xs text-muted-foreground">
                상담 진행중
              </p>
            </CardContent>
          </div>

          <div className="card-modern group hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료</CardTitle>
              <div className="p-2 rounded-lg bg-trust-100 dark:bg-trust-950/50 group-hover:bg-trust-200 dark:group-hover:bg-trust-900/50 transition-colors">
                <CheckCircle className="h-4 w-4 text-trust-600 dark:text-trust-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">9</div>
              <p className="text-xs text-muted-foreground">
                성공적으로 해결
              </p>
            </CardContent>
          </div>

          <div className="card-modern group hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">응답률</CardTitle>
              <div className="p-2 rounded-lg bg-protection-100 dark:bg-protection-950/50 group-hover:bg-protection-200 dark:group-hover:bg-protection-900/50 transition-colors">
                <Zap className="h-4 w-4 text-protection-600 dark:text-protection-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">95%</div>
              <p className="text-xs text-muted-foreground">
                24시간 내 응답
              </p>
            </CardContent>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}