'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import {
  Users,
  FileText,
  Briefcase,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Download,
  Settings,
  Shield,
  BarChart3,
  Bell,
  Building,
  UserCheck
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Mock data for association admin dashboard
const associationStats = {
  total_teachers: 89,
  active_teachers: 67,
  total_lawyers: 3,
  total_reports: 123,
  pending_reports: 8,
  completed_reports: 98,
  average_response_time: '20시간',
  satisfaction_rate: 4.6,
  daily_reports: 3,
  weekly_reports: 18,
  monthly_reports: 67
};

const recentActivities = [
  {
    id: '1',
    type: 'report',
    action: '새 신고 접수',
    user: '익명교사123',
    time: '2025-08-28T10:00:00Z',
    icon: FileText
  },
  {
    id: '2',
    type: 'consult',
    action: '변호사 답변 등록',
    user: '김변호사',
    time: '2025-08-28T09:30:00Z',
    icon: Briefcase
  },
  {
    id: '3',
    type: 'user',
    action: '교사 회원 가입',
    user: '익명교사456',
    time: '2025-08-28T09:00:00Z',
    icon: Users
  },
  {
    id: '4',
    type: 'report',
    action: '신고 상태 변경 (완료)',
    user: '관리자',
    time: '2025-08-28T08:45:00Z',
    icon: CheckCircle
  }
];

const assignedLawyers = [
  {
    id: 'lawyer-1',
    name: '김변호사',
    specialty: '교육법',
    handled_cases: 23,
    average_response: '18시간',
    satisfaction: 4.8,
    status: 'active'
  },
  {
    id: 'lawyer-2',
    name: '이변호사',
    specialty: '학교폭력',
    handled_cases: 19,
    average_response: '22시간',
    satisfaction: 4.5,
    status: 'active'
  },
  {
    id: 'lawyer-3',
    name: '박변호사',
    specialty: '민사소송',
    handled_cases: 15,
    average_response: '25시간',
    satisfaction: 4.4,
    status: 'inactive'
  }
];

// Chart data (simplified)
const chartData = {
  labels: ['월', '화', '수', '목', '금', '토', '일'],
  reports: [5, 7, 3, 4, 6, 2, 1],
  consults: [3, 5, 2, 3, 4, 1, 1]
};

export default function AssociationAdminPage() {
  const { user } = useStore();
  const router = useRouter();

  // Redirect non-association admins to their respective pages (only after user is loaded)
  useEffect(() => {
    // Wait until user is fully loaded before redirecting
    if (user && user.role && user.role !== 'admin') {
      console.log('🔍 [ASSOCIADMIN] Redirecting user with role:', user.role);
      switch (user.role) {
        case 'super_admin':
          router.push('/admin');
          break;
        case 'teacher':
          router.push('/teacher');
          break;
        case 'lawyer':
          router.push('/lawyer');
          break;
        default:
          router.push('/');
          break;
      }
    } else if (user && user.role === 'admin') {
      console.log('🔍 [ASSOCIADMIN] User is association admin, staying on page');
    }
  }, [user, router]);

  // Show loading while user is being loaded or if user is not association admin
  if (!user) {
    console.log('🔍 [ASSOCIADMIN] User is null, showing loading');
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">사용자 정보 로딩 중...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (user.role !== 'admin') {
    console.log('🔍 [ASSOCIADMIN] User role is not admin:', user.role);
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">역할 확인 중...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building className="h-8 w-8 text-primary" />
              협회관리자 대시보드
            </h1>
            <p className="text-muted-foreground mt-2">
              안녕하세요, {user.name}님! 협회 소속 교사들의 교권 보호를 지원합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              월간 보고서
            </Button>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              협회 설정
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">협회 교사</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{associationStats.total_teachers}</div>
              <p className="text-xs text-muted-foreground">
                활성: {associationStats.active_teachers}명
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">신고 처리율</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((associationStats.completed_reports / associationStats.total_reports) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {associationStats.completed_reports}/{associationStats.total_reports} 완료
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 응답시간</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{associationStats.average_response_time}</div>
              <p className="text-xs text-muted-foreground">
                목표: 24시간 이내
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">만족도</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{associationStats.satisfaction_rate}/5.0</div>
              <p className="text-xs text-muted-foreground">
                협회 평균 만족도
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>협회 신고 통계</CardTitle>
            <CardDescription>
              일주일간 협회 내 신고 및 상담 현황
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Simple chart representation */}
              <div className="h-48 flex items-end justify-between gap-2">
                {chartData.labels.map((label, index) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/20 rounded-t"
                        style={{ height: `${chartData.reports[index] * 12}px` }}
                      />
                      <div
                        className="w-full bg-primary rounded-t"
                        style={{ height: `${chartData.consults[index] * 12}px` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary/20 rounded" />
                  <span>신고</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded" />
                  <span>상담</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Assigned Lawyers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                배정 변호사 현황
                <Badge>{assignedLawyers.length}명</Badge>
              </CardTitle>
              <CardDescription>
                협회에 배정된 변호사들의 활동 통계
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignedLawyers.map((lawyer) => (
                  <div key={lawyer.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{lawyer.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {lawyer.specialty}
                        </Badge>
                        <Badge variant={lawyer.status === 'active' ? 'success' : 'secondary'}>
                          {lawyer.status === 'active' ? '활동중' : '비활동'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>처리: {lawyer.handled_cases}건</span>
                        <span>응답: {lawyer.average_response}</span>
                        <span>만족도: {lawyer.satisfaction}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      상세
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>최근 협회 활동</CardTitle>
              <CardDescription>
                협회 내 최근 활동 현황
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>
                          <span className="text-muted-foreground"> • {activity.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.time)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>협회 관리 기능</CardTitle>
            <CardDescription>
              자주 사용하는 협회 관리 기능들
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-6">
              <Link href="/admin/memberships">
                <Button variant="outline" className="justify-start w-full">
                  <UserCheck className="h-4 w-4 mr-2" />
                  회원 관리
                </Button>
              </Link>
              <Link href="/admin/lawyers">
                <Button variant="outline" className="justify-start w-full">
                  <Briefcase className="h-4 w-4 mr-2" />
                  변호사 관리
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button variant="outline" className="justify-start w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  신고 관리
                </Button>
              </Link>
              <Link href="/admin/consultations">
                <Button variant="outline" className="justify-start w-full">
                  <Activity className="h-4 w-4 mr-2" />
                  상담 모니터링
                </Button>
              </Link>
              <Link href="/admin/notifications">
                <Button variant="outline" className="justify-start w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  알림 관리
                </Button>
              </Link>
              <Button variant="outline" className="justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                협회 통계
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Association Info */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex space-x-3">
              <Building className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-2">협회 현황</p>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs opacity-80">소속 학교</p>
                    <p className="font-medium">12개교</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80">미처리 신고</p>
                    <p className="font-medium">{associationStats.pending_reports}건</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80">이번 달 신고</p>
                    <p className="font-medium">{associationStats.monthly_reports}건</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80">마지막 업데이트</p>
                    <p className="font-medium">1시간 전</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}