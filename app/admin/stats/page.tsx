'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, Users, Shield, FileText, TrendingUp, Activity } from 'lucide-react';

export default function SystemStatsPage() {
  const { user } = useStore();

  // 슈퍼어드민 및 관리자 권한 확인
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
          <p className="text-muted-foreground">
            이 페이지는 관리자만 접근할 수 있습니다.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <a href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              관리자 대시보드
            </a>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              시스템 통계
            </h1>
            <p className="text-muted-foreground">
              교권119 시스템의 전체적인 통계와 현황을 확인하세요
            </p>
          </div>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12.5%</span> 지난 달 대비
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 신고 건수</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,423</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">+8.2%</span> 지난 달 대비
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">해결 완료</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,238</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">87%</span> 해결률
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">월 활성 사용자</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,847</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+18.3%</span> 지난 달 대비
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 상세 통계 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>사용자 역할별 분포</CardTitle>
              <CardDescription>
                시스템에 등록된 사용자들의 역할별 현황
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>교사</span>
                </div>
                <div className="font-semibold">2,456명 (86.3%)</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>변호사</span>
                </div>
                <div className="font-semibold">87명 (3.1%)</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>관리자</span>
                </div>
                <div className="font-semibold">23명 (0.8%)</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>슈퍼관리자</span>
                </div>
                <div className="font-semibold">3명 (0.1%)</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>신고 유형별 현황</CardTitle>
              <CardDescription>
                최근 6개월간 접수된 신고 유형별 통계
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>학부모 관련</span>
                <div className="font-semibold">634건 (44.5%)</div>
              </div>
              <div className="flex items-center justify-between">
                <span>학생 관련</span>
                <div className="font-semibold">423건 (29.7%)</div>
              </div>
              <div className="flex items-center justify-between">
                <span>명예훼손</span>
                <div className="font-semibold">234건 (16.4%)</div>
              </div>
              <div className="flex items-center justify-between">
                <span>기타</span>
                <div className="font-semibold">132건 (9.3%)</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 시스템 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              실시간 시스템 활동
            </CardTitle>
            <CardDescription>
              최근 시스템 활동 로그
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">새로운 신고 접수</p>
                  <p className="text-sm text-muted-foreground">김교사님이 학부모 갈등 신고를 접수했습니다.</p>
                </div>
                <span className="text-sm text-muted-foreground">2분 전</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">신고 처리 완료</p>
                  <p className="text-sm text-muted-foreground">이변호사님이 신고 #1234에 대한 상담을 완료했습니다.</p>
                </div>
                <span className="text-sm text-muted-foreground">15분 전</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">새 사용자 가입</p>
                  <p className="text-sm text-muted-foreground">박교사님이 시스템에 가입했습니다.</p>
                </div>
                <span className="text-sm text-muted-foreground">1시간 전</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}