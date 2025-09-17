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
        {/* Simplified Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 via-white to-protection-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 border border-border/40">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2">
              안녕하세요, <span className="gradient-text">{user?.name || '선생님'}</span>
            </h1>
            <p className="text-muted-foreground">
              교권119가 선생님의 권리를 지켜드립니다
            </p>
          </div>
        </div>

        {/* Main Content Grid - Focused on Reports and Community */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* My Reports */}
          <div className="card-modern">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary-600" />
                  <CardTitle>내 신고 내역</CardTitle>
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
                  <div key={report.id} className="flex items-start justify-between p-4 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        {getPriorityIcon(report.priority)}
                        <p className="font-medium">{report.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(report.created_at)}
                      </p>
                    </div>
                    <div className={`${getStatusBadgeClass(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </div>
                  </div>
                ))}
                {recentReports.length === 0 && (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">신고 내역이 없습니다</p>
                    <Link href="/reports/new">
                      <Button className="btn-urgent-modern">
                        <Plus className="h-4 w-4 mr-2" />
                        신고 접수하기
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </div>

          {/* Popular Community Posts */}
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
                  <Link key={post.id} href={`/community/${post.id}`}>
                    <div className="p-4 rounded-xl bg-trust-50/50 dark:bg-trust-950/20 border border-trust-200/50 dark:border-trust-800/50 hover:bg-trust-100/50 dark:hover:bg-trust-900/30 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-medium flex-1 leading-relaxed">{post.title}</p>
                        <div className="badge-trust-modern text-xs ml-3">
                          {post.category === 'tip' ? '팁' : post.category === 'experience' ? '경험' : '건강'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{post.author}</span>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span>{post.likes}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4 text-blue-500" />
                            <span>{post.comments}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}