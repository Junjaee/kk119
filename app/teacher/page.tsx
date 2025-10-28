'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import {
  FileText,
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
  Zap,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/lib/utils/date';

interface Report {
  id: string;
  title: string;
  status: string;
  created_at: string;
  report_type: string;
  priority?: string;
}

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

export default function TeacherPage() {
  const { user, setUser } = useStore();
  const router = useRouter();
  const [showAllReports, setShowAllReports] = useState(false);
  const [currentReportPage, setCurrentReportPage] = useState(0);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const reportsPerPage = 5;

  // CRITICAL FIX: Initialize user information independently if store is empty
  // This handles the case where redirects happen before store hydration
  useEffect(() => {
    const initializeUserInfo = async () => {
      console.log('🔍 [TEACHER] Checking user initialization...');

      // If user is already in store, skip manual initialization
      if (user) {
        console.log('🔍 [TEACHER] User already in store:', { id: user.id, email: user.email, role: user.role });
        setIsInitializing(false);
        return;
      }

      // Check for token in localStorage
      const token = localStorage.getItem('token');
      console.log('🔍 [TEACHER] Token in localStorage:', !!token);

      if (!token) {
        console.log('🔍 [TEACHER] No token found, redirecting to login');
        setIsInitializing(false);
        router.push('/login');
        return;
      }

      // Token exists but user is null - fetch user info directly
      try {
        console.log('🔍 [TEACHER] Fetching user info from /api/auth/me');
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'omit'
        });

        console.log('🔍 [TEACHER] /api/auth/me response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('🔍 [TEACHER] User data received:', data.user);

          if (data.user) {
            const fetchedUser = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              association_id: data.user.association_id,
              school: data.user.school,
              position: data.user.position,
              phone: data.user.phone,
              isAdmin: data.user.isAdmin,
              isVerified: data.user.isVerified,
              created_at: data.user.created_at || data.user.createdAt,
              updated_at: data.user.updated_at || data.user.updatedAt,
              last_login: data.user.last_login || data.user.lastLogin
            };

            console.log('🔍 [TEACHER] Setting user in store:', { id: fetchedUser.id, email: fetchedUser.email, role: fetchedUser.role });
            setUser(fetchedUser);
            setIsInitializing(false);
          }
        } else if (response.status === 401) {
          console.log('⚠️ [TEACHER] Token expired or invalid, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('kyokwon119-storage');
          setIsInitializing(false);
          router.push('/login');
        } else {
          console.error('⚠️ [TEACHER] Unexpected response status:', response.status);
          setIsInitializing(false);
          router.push('/login');
        }
      } catch (error) {
        console.error('❌ [TEACHER] Error fetching user info:', error);
        setIsInitializing(false);
        router.push('/login');
      }
    };

    initializeUserInfo();
  }, []); // Only run once on mount

  // Redirect non-teachers to their respective pages (only after user is loaded)
  useEffect(() => {
    // Wait until user is fully loaded before redirecting
    if (user && user.role && user.role !== 'teacher') {
      console.log('🔍 [TEACHER] Redirecting user with role:', user.role);
      switch (user.role) {
        case 'super_admin':
          router.push('/super-admin');
          break;
        case 'lawyer':
          router.push('/lawyer');
          break;
        default:
          router.push('/');
          break;
      }
    } else if (user && user.role === 'teacher') {
      console.log('🔍 [TEACHER] User is teacher, staying on page');
    }
  }, [user, router]);

  // Fetch user's reports when user is loaded and is a teacher
  useEffect(() => {
    const fetchReports = async () => {
      if (!user || user.role !== 'teacher') return;

      try {
        setIsLoadingReports(true);
        setReportError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          setReportError('인증 토큰이 없습니다');
          return;
        }

        const response = await fetch('/api/consult', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data.consults) {
          // Convert API response to match our interface
          const reports: Report[] = data.data.consults.map((consult: any) => ({
            id: consult.id.toString(),
            title: consult.title,
            status: consult.report_status || 'pending',
            created_at: consult.created_at,
            report_type: consult.report_type,
            priority: 'medium' // Default priority since API doesn't provide this
          }));

          setRecentReports(reports);
          console.log('📋 [TEACHER] Fetched reports:', reports);
        } else {
          console.error('📋 [TEACHER] Failed to fetch reports:', data);
          setReportError(data.error || '신고 내역을 불러올 수 없습니다');
        }
      } catch (error) {
        console.error('📋 [TEACHER] Error fetching reports:', error);
        setReportError('신고 내역을 불러오는 중 오류가 발생했습니다');
      } finally {
        setIsLoadingReports(false);
      }
    };

    fetchReports();
  }, [user]);

  // Show loading while initializing
  if (isInitializing || !user) {
    console.log('🔍 [TEACHER] Loading - isInitializing:', isInitializing, 'user:', !!user);
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

  // Show loading if user role is not teacher (redirect in progress)
  if (user.role !== 'teacher') {
    console.log('🔍 [TEACHER] User role is not teacher:', user.role);
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

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      pending: 'status-received',
      reviewing: 'status-reviewing',
      consulting: 'status-consulting',
      completed: 'status-completed',
      received: 'status-received',
    };

    return statusClasses[status] || 'status-received';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '접수대기',
      reviewing: '검토중',
      consulting: '상담진행',
      completed: '해결완료',
      received: '접수완료',
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

  // 표시할 신고 내역 계산
  const getDisplayedReports = () => {
    if (!recentReports || recentReports.length === 0) {
      return [];
    }

    if (!showAllReports) {
      return recentReports.slice(0, 1); // 기본적으로 최신 1개만
    }

    const startIndex = currentReportPage * reportsPerPage;
    const endIndex = startIndex + reportsPerPage;
    return recentReports.slice(startIndex, endIndex);
  };

  const totalPages = recentReports.length > 0 ? Math.ceil(recentReports.length / reportsPerPage) : 0;
  const displayedReports = getDisplayedReports();

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary-600">교사 대시보드</h1>
          <p className="text-muted-foreground">안녕하세요, {user.name}님! 교권 보호를 위해 함께하겠습니다.</p>
        </div>

        {/* My Reports - Top Priority Section */}
        <div className="card-modern">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-primary-600" />
                <CardTitle className="text-xl">내 신고 내역</CardTitle>
              </div>
              <Link href="/teacher/reports">
                <Button variant="ghost" size="sm" className="text-xs">
                  전체보기 <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingReports ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">신고 내역을 불러오는 중...</p>
              </div>
            ) : reportError ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-red-600">오류 발생</h3>
                <p className="text-muted-foreground mb-6">{reportError}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReportError(null);
                    setIsLoadingReports(true);
                    // Re-trigger the useEffect to fetch reports again
                    const token = localStorage.getItem('token');
                    if (token && user) {
                      fetch('/api/consult', {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                      }).then(async (response) => {
                        if (!response.ok) {
                          throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const data = await response.json();
                        if (data.success && data.data.consults) {
                          const reports: Report[] = data.data.consults.map((consult: any) => ({
                            id: consult.id.toString(),
                            title: consult.title,
                            status: consult.report_status || 'pending',
                            created_at: consult.created_at,
                            report_type: consult.report_type,
                            priority: 'medium'
                          }));
                          setRecentReports(reports);
                        } else {
                          setReportError(data.error || '신고 내역을 불러올 수 없습니다');
                        }
                      }).catch((error) => {
                        console.error('Error refetching reports:', error);
                        setReportError('신고 내역을 불러오는 중 오류가 발생했습니다');
                      }).finally(() => {
                        setIsLoadingReports(false);
                      });
                    }
                  }}
                  className="text-sm"
                >
                  다시 시도
                </Button>
              </div>
            ) : recentReports.length > 0 ? (
              <div className="space-y-6">
                {/* 신고 내역 목록 */}
                {displayedReports.map((report, index) => (
                  <div key={report.id} className="space-y-4">
                    {/* Report Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getPriorityIcon(report.priority)}
                        <div>
                          <h3 className="font-semibold text-lg">{report.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatRelativeTime(report.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className={`${getStatusBadgeClass(report.status)}`}>
                        {getStatusLabel(report.status)}
                      </div>
                    </div>

                    {/* 구분선 (마지막 항목이 아닌 경우) */}
                    {index < displayedReports.length - 1 && (
                      <div className="border-t border-border/30 pt-6" />
                    )}
                  </div>
                ))}

                {/* 펼쳐보기/접기 및 페이지네이션 */}
                {recentReports.length > 1 && (
                  <div className="space-y-4 pt-4 border-t border-border/30">
                    {/* 펼쳐보기/접기 버튼 */}
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAllReports(!showAllReports);
                          if (showAllReports) {
                            setCurrentReportPage(0);
                          }
                        }}
                        className="text-sm"
                      >
                        {showAllReports ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            접기 (최신 1개만 보기)
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            펼쳐보기 ({recentReports?.length || 0}개 신고 내역)
                          </>
                        )}
                      </Button>
                    </div>

                    {/* 페이지네이션 (펼쳐보기 상태일 때만) */}
                    {showAllReports && totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {recentReports.length > 0 ? `${currentReportPage * reportsPerPage + 1}-${Math.min((currentReportPage + 1) * reportsPerPage, recentReports.length)} / ${recentReports.length}개` : '0개'}
                        </p>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentReportPage(Math.max(0, currentReportPage - 1))}
                            disabled={currentReportPage === 0 || totalPages <= 1}
                            className="text-xs"
                          >
                            이전
                          </Button>

                          <div className="flex space-x-1">
                            {totalPages > 0 && Array.from({ length: totalPages }, (_, i) => (
                              <Button
                                key={i}
                                variant={currentReportPage === i ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentReportPage(i)}
                                className="w-8 h-8 text-xs"
                              >
                                {i + 1}
                              </Button>
                            ))}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentReportPage(Math.min(Math.max(0, totalPages - 1), currentReportPage + 1))}
                            disabled={currentReportPage >= totalPages - 1 || totalPages <= 1}
                            className="text-xs"
                          >
                            다음
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">신고 내역이 없습니다</h3>
                <p className="text-muted-foreground mb-6">
                  교권 침해 상황이 발생하면 언제든지 신고해주세요
                </p>
                <Link href="/teacher/reports/new">
                  <Button className="btn-urgent-modern">
                    <Plus className="h-4 w-4 mr-2" />
                    신고 접수하기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </div>

        {/* Two Boards in One Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Popular Community Posts */}
          <div className="card-modern">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-trust-600" />
                  <CardTitle>커뮤니티</CardTitle>
                </div>
                <Link href="/teacher/community">
                  <Button variant="ghost" size="sm" className="text-xs">
                    전체보기 <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {popularPosts.slice(0, 3).map((post) => (
                  <Link key={post.id} href={`/teacher/community/${post.id}`}>
                    <div className="p-3 rounded-xl bg-trust-50/50 dark:bg-trust-950/20 border border-trust-200/50 dark:border-trust-800/50 hover:bg-trust-100/50 dark:hover:bg-trust-900/30 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm flex-1 leading-relaxed line-clamp-2">{post.title}</p>
                        <div className="badge-trust-modern text-xs ml-2 flex-shrink-0">
                          {post.category === 'tip' ? '팁' : post.category === 'experience' ? '경험' : '건강'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{post.author}</span>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
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
                  </Link>
                ))}
              </div>
            </CardContent>
          </div>

          {/* Recent Resources */}
          <div className="card-modern">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-secondary-600" />
                  <CardTitle>교권 자료실</CardTitle>
                </div>
                <Link href="/teacher/resources">
                  <Button variant="ghost" size="sm" className="text-xs">
                    전체보기 <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    id: 1,
                    title: '학급 운영 노하우 모음집',
                    category: '학급경영',
                    uploader_name: '베테랑교사',
                    download_count: 32,
                    created_at: '2025-08-18T14:30:00Z'
                  },
                  {
                    id: 2,
                    title: '수학 교육과정 변화 가이드',
                    category: '교육과정',
                    uploader_name: '수학교사김선생',
                    download_count: 45,
                    created_at: '2025-08-20T10:00:00Z'
                  },
                  {
                    id: 3,
                    title: '학부모 상담 대화법',
                    category: '상담',
                    uploader_name: '상담전문가',
                    download_count: 28,
                    created_at: '2025-08-15T09:15:00Z'
                  }
                ].slice(0, 3).map((resource) => (
                  <Link key={resource.id} href={`/teacher/resources`}>
                    <div className="p-3 rounded-xl bg-secondary-50/50 dark:bg-secondary-950/20 border border-secondary-200/50 dark:border-secondary-800/50 hover:bg-secondary-100/50 dark:hover:bg-secondary-900/30 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium flex-1 line-clamp-2">{resource.title}</p>
                        <div className="badge-secondary-modern text-xs ml-2 flex-shrink-0">
                          {resource.category}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{resource.uploader_name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>{resource.download_count}</span>
                          </span>
                          <span>{formatRelativeTime(resource.created_at)}</span>
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