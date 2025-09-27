'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Scale,
  MessageSquare,
  Building2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Share2,
  Bell,
  Calendar,
  Download,
  RefreshCcw,
  Filter,
  Eye,
  UserPlus,
  UserCheck,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { AuthGuard, RoleGuard } from '@/components/auth/permission-guard';
import { useStore } from '@/lib/store';

interface DashboardStats {
  overview: {
    totalReports: number;
    totalUsers: number;
    totalAssociations: number;
    totalConsultations: number;
    pendingReports: number;
    resolvedReports: number;
    activeDiscussions: number;
    totalShares: number;
  };
  trends: {
    reportsTrend: number; // percentage change
    usersTrend: number;
    consultationsTrend: number;
    sharesTrend: number;
  };
  recentActivity: ActivityItem[];
  topCategories: CategoryStat[];
  userEngagement: EngagementStat[];
  systemHealth: HealthMetric[];
}

interface ActivityItem {
  id: string;
  type: 'report_created' | 'consultation_answered' | 'user_joined' | 'report_shared' | 'association_approved';
  description: string;
  userName: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
  trend: number;
}

interface EngagementStat {
  metric: string;
  value: number;
  unit: string;
  change: number;
}

interface HealthMetric {
  name: string;
  status: 'good' | 'warning' | 'error';
  value: string;
  description: string;
}

export default function AdminDashboardPage() {
  const { user } = useStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d
  const [refreshing, setRefreshing] = useState(false);

  // Mock dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockStats: DashboardStats = {
        overview: {
          totalReports: 1247,
          totalUsers: 856,
          totalAssociations: 23,
          totalConsultations: 342,
          pendingReports: 45,
          resolvedReports: 892,
          activeDiscussions: 127,
          totalShares: 234,
        },
        trends: {
          reportsTrend: 12.5,
          usersTrend: 8.3,
          consultationsTrend: 15.7,
          sharesTrend: 22.1,
        },
        recentActivity: [
          {
            id: '1',
            type: 'report_created',
            description: '새로운 괴롭힘 신고가 접수되었습니다',
            userName: '김선생',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            priority: 'high'
          },
          {
            id: '2',
            type: 'consultation_answered',
            description: '변호사 상담에 답변이 등록되었습니다',
            userName: '박변호사',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            priority: 'medium'
          },
          {
            id: '3',
            type: 'user_joined',
            description: '새로운 사용자가 가입했습니다',
            userName: '이선생',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            priority: 'low'
          },
          {
            id: '4',
            type: 'report_shared',
            description: '신고서가 협회와 공유되었습니다',
            userName: '최선생',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            priority: 'medium'
          },
          {
            id: '5',
            type: 'association_approved',
            description: '새로운 협회가 승인되었습니다',
            userName: '관리자',
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            priority: 'medium'
          }
        ],
        topCategories: [
          { category: '괴롭힘/성희롱', count: 345, percentage: 27.7, trend: 5.2 },
          { category: '학부모 민원', count: 298, percentage: 23.9, trend: -2.1 },
          { category: '교육공무원법', count: 234, percentage: 18.8, trend: 8.4 },
          { category: '학생 폭력', count: 198, percentage: 15.9, trend: 3.7 },
          { category: '기타', count: 172, percentage: 13.8, trend: 1.2 }
        ],
        userEngagement: [
          { metric: '일평균 접속자', value: 247, unit: '명', change: 12.3 },
          { metric: '월평균 신고 건수', value: 89, unit: '건', change: 8.7 },
          { metric: '상담 완료율', value: 87.5, unit: '%', change: 4.2 },
          { metric: '협회 참여율', value: 73.2, unit: '%', change: 15.6 }
        ],
        systemHealth: [
          { name: '서버 상태', status: 'good', value: '정상', description: '모든 서버가 정상 작동 중' },
          { name: '응답 시간', status: 'good', value: '187ms', description: '평균 응답 시간이 양호함' },
          { name: '데이터베이스', status: 'warning', value: '80% 사용', description: '데이터베이스 용량 확인 필요' },
          { name: '오류율', status: 'good', value: '0.02%', description: '오류율이 낮음' }
        ]
      };

      setStats(mockStats);
      setLoading(false);
    };

    loadDashboardData();
  }, [dateRange]);

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'report_created': return FileText;
      case 'consultation_answered': return Scale;
      case 'user_joined': return UserPlus;
      case 'report_shared': return Share2;
      case 'association_approved': return Building2;
      default: return Activity;
    }
  };

  const getActivityColor = (priority: ActivityItem['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatTrend = (trend: number) => {
    const isPositive = trend > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{Math.abs(trend)}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">데이터를 불러올 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">
            대시보드 데이터를 가져오는 중 오류가 발생했습니다.
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <AuthGuard>
      <RoleGuard roles={['super_admin', 'admin']}>
        <DashboardLayout>
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <BarChart3 className="h-8 w-8" />
                  협회관리자 대시보드
                </h1>
                <p className="text-muted-foreground mt-2">
                  협회 전체 현황과 통계를 확인하세요
                </p>
              </div>
              <div className="flex gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">최근 7일</SelectItem>
                    <SelectItem value="30d">최근 30일</SelectItem>
                    <SelectItem value="90d">최근 90일</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={refreshData} disabled={refreshing}>
                  <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  새로고침
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  리포트 다운로드
                </Button>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">총 신고 건수</p>
                      <div className="text-2xl font-bold">{stats.overview.totalReports.toLocaleString()}</div>
                      {formatTrend(stats.trends.reportsTrend)}
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">총 사용자</p>
                      <div className="text-2xl font-bold">{stats.overview.totalUsers.toLocaleString()}</div>
                      {formatTrend(stats.trends.usersTrend)}
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">변호사 상담</p>
                      <div className="text-2xl font-bold">{stats.overview.totalConsultations.toLocaleString()}</div>
                      {formatTrend(stats.trends.consultationsTrend)}
                    </div>
                    <Scale className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">보고서 공유</p>
                      <div className="text-2xl font-bold">{stats.overview.totalShares.toLocaleString()}</div>
                      {formatTrend(stats.trends.sharesTrend)}
                    </div>
                    <Share2 className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    처리 현황
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">대기 중</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{stats.overview.pendingReports}</Badge>
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">해결 완료</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{stats.overview.resolvedReports}</Badge>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">활발한 토론</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{stats.overview.activeDiscussions}</Badge>
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    사용자 참여도
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.userEngagement.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{metric.metric}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.value}{metric.unit}</span>
                        {formatTrend(metric.change)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    시스템 상태
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.systemHealth.map((health, index) => {
                    const statusColor = {
                      good: 'text-green-600',
                      warning: 'text-orange-600',
                      error: 'text-red-600'
                    }[health.status];

                    const StatusIcon = health.status === 'good' ? CheckCircle :
                                      health.status === 'warning' ? AlertTriangle :
                                      AlertTriangle;

                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{health.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${statusColor}`}>
                            {health.value}
                          </span>
                          <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Charts and Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    주요 신고 유형
                  </CardTitle>
                  <CardDescription>
                    가장 많이 신고된 카테고리별 현황
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.topCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{category.count}건</span>
                          {formatTrend(category.trend)}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.percentage}% of total
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    최근 활동
                  </CardTitle>
                  <CardDescription>
                    시스템에서 일어난 최근 활동 현황
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.recentActivity.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    const colorClass = getActivityColor(activity.priority);

                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800`}>
                          <Icon className={`h-4 w-4 ${colorClass}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{activity.userName}</span>
                            <span>·</span>
                            <span>{new Date(activity.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>빠른 작업</CardTitle>
                <CardDescription>
                  자주 사용하는 관리 기능에 빠르게 접근하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/admin/associations">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      <Building2 className="h-6 w-6" />
                      <span className="text-sm">협회 관리</span>
                    </Button>
                  </Link>

                  <Link href="/reports">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      <FileText className="h-6 w-6" />
                      <span className="text-sm">신고서 관리</span>
                    </Button>
                  </Link>


                  <Link href="/notifications">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      <Bell className="h-6 w-6" />
                      <span className="text-sm">알림 관리</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </RoleGuard>
    </AuthGuard>
  );
}