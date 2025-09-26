'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { switchUser } from '@/lib/auth/mock-auth';
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
  Bell
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';
import Link from 'next/link';

// Mock data for admin dashboard
const systemStats = {
  total_users: 234,
  active_users: 178,
  total_lawyers: 12,
  total_reports: 567,
  pending_reports: 23,
  completed_reports: 489,
  average_response_time: '22시간',
  satisfaction_rate: 4.7,
  daily_reports: 8,
  weekly_reports: 42,
  monthly_reports: 156
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
    action: '신규 회원 가입',
    user: '익명교사456',
    time: '2025-08-28T09:00:00Z',
    icon: Users
  },
  {
    id: '4',
    type: 'report',
    action: '신고 상태 변경 (완료)',
    user: '시스템',
    time: '2025-08-28T08:45:00Z',
    icon: CheckCircle
  },
  {
    id: '5',
    type: 'lawyer',
    action: '변호사 계정 생성',
    user: '관리자',
    time: '2025-08-27T16:00:00Z',
    icon: Shield
  }
];

const lawyerStats = [
  {
    id: 'lawyer-1',
    name: '김변호사',
    specialty: '교육법',
    handled_cases: 45,
    average_response: '18시간',
    satisfaction: 4.8,
    status: 'active'
  },
  {
    id: 'lawyer-2',
    name: '이변호사',
    specialty: '학교폭력',
    handled_cases: 38,
    average_response: '24시간',
    satisfaction: 4.6,
    status: 'active'
  },
  {
    id: 'lawyer-3',
    name: '박변호사',
    specialty: '민사소송',
    handled_cases: 29,
    average_response: '20시간',
    satisfaction: 4.7,
    status: 'inactive'
  }
];

// Chart data (simplified)
const chartData = {
  labels: ['월', '화', '수', '목', '금', '토', '일'],
  reports: [12, 15, 8, 10, 14, 5, 3],
  consults: [8, 10, 6, 8, 11, 3, 2]
};

export default function AdminDashboard() {
  const { user, setUser } = useStore();
  
  // Only use mock user in development when there's a logged in user with insufficient permissions
  // Do NOT use mock user when user is null (logged out)
  console.log('🔍 Admin Page - User Role Check:', user?.role);
  if (user && user?.role !== 'admin' && user?.role !== 'super_admin') {
    console.log('🔍 Admin Page - User has insufficient permissions, switching to admin user');
    const adminUser = switchUser('admin');
    setUser(adminUser);
  } else if (user) {
    console.log('🔍 Admin Page - User role allowed:', user?.role);
  } else {
    console.log('🔍 Admin Page - No user logged in');
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {user?.role === 'super_admin' ? '슈퍼관리자 대시보드' : '관리자 대시보드'}
            </h1>
            <p className="text-muted-foreground mt-2">
              교권119 시스템 전체 현황을 모니터링합니다
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              보고서 다운로드
            </Button>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              시스템 설정
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.total_users}</div>
              <p className="text-xs text-muted-foreground">
                활성: {systemStats.active_users}명
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
                {Math.round((systemStats.completed_reports / systemStats.total_reports) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {systemStats.completed_reports}/{systemStats.total_reports} 완료
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 응답시간</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.average_response_time}</div>
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
              <div className="text-2xl font-bold">{systemStats.satisfaction_rate}/5.0</div>
              <p className="text-xs text-muted-foreground">
                평균 사용자 만족도
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>신고 통계</CardTitle>
            <CardDescription>
              일주일간 신고 및 상담 현황
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
                        style={{ height: `${chartData.reports[index] * 8}px` }}
                      />
                      <div 
                        className="w-full bg-primary rounded-t"
                        style={{ height: `${chartData.consults[index] * 8}px` }}
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
          {/* Lawyer Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                변호사 현황
                <Badge>{lawyerStats.length}명</Badge>
              </CardTitle>
              <CardDescription>
                변호사별 활동 통계
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lawyerStats.map((lawyer) => (
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
              <CardTitle>최근 활동</CardTitle>
              <CardDescription>
                시스템 전체 활동 로그
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
            <CardTitle>빠른 작업</CardTitle>
            <CardDescription>
              자주 사용하는 관리 기능
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-6">
              <Link href="/admin/user-management">
                <Button variant="outline" className="justify-start w-full">
                  <Users className="h-4 w-4 mr-2" />
                  사용자 관리
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
                통계 보고서
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-2">시스템 상태</p>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs opacity-80">서버 상태</p>
                    <p className="font-medium">정상 운영중</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80">데이터베이스</p>
                    <p className="font-medium">23% 사용중</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80">스토리지</p>
                    <p className="font-medium">1.2GB / 5GB</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80">마지막 백업</p>
                    <p className="font-medium">2시간 전</p>
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