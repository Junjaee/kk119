'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { UserManager } from '@/components/admin/user-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import {
  Users,
  Shield,
  UserCheck,
  Scale,
  GraduationCap,
  Settings,
  Download,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { roleDisplayNames } from '@/lib/types/user';

export default function UserManagementPage() {
  const { user } = useStore();

  // 슈퍼어드민 권한 확인
  if (user?.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">접근 권한 없음</h2>
                <p className="text-muted-foreground mb-4">
                  이 페이지는 슈퍼어드민만 접근할 수 있습니다.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm">현재 권한:</span>
                  <Badge>{roleDisplayNames[user?.role || 'teacher']}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 페이지 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              사용자 관리
            </h1>
            <p className="text-muted-foreground mt-2">
              시스템의 모든 사용자를 생성, 수정, 관리합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              사용자 통계
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              사용자 목록 내보내기
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              관리 설정
            </Button>
          </div>
        </div>

        {/* 시스템 개요 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234</div>
              <p className="text-xs text-muted-foreground">
                +12 지난 주 대비
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">관리자</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                슈퍼어드민 1명 포함
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">변호사</CardTitle>
              <Scale className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">
                +2 이번 달
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">교사</CardTitle>
              <GraduationCap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">211</div>
              <p className="text-xs text-muted-foreground">
                활성: 178명
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 중요 알림 */}
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <CardContent className="pt-6">
            <div className="flex space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <p className="font-semibold mb-2">사용자 관리 주의사항</p>
                <ul className="space-y-1 list-disc list-inside text-xs">
                  <li>슈퍼어드민이 생성한 계정은 자동으로 승인됩니다.</li>
                  <li>생성된 계정의 임시 비밀번호는 사용자에게 직접 전달하세요.</li>
                  <li>계정 삭제 대신 비활성화를 권장합니다.</li>
                  <li>역할 변경 시 권한이 즉시 적용됩니다.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 권한 매트릭스 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              역할별 권한 매트릭스
            </CardTitle>
            <CardDescription>
              각 역할별로 시스템에서 사용할 수 있는 기능들을 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">기능</th>
                    <th className="text-center p-2">
                      <div className="flex items-center justify-center gap-1">
                        <Shield className="h-4 w-4" />
                        슈퍼어드민
                      </div>
                    </th>
                    <th className="text-center p-2">
                      <div className="flex items-center justify-center gap-1">
                        <UserCheck className="h-4 w-4" />
                        관리자
                      </div>
                    </th>
                    <th className="text-center p-2">
                      <div className="flex items-center justify-center gap-1">
                        <Scale className="h-4 w-4" />
                        변호사
                      </div>
                    </th>
                    <th className="text-center p-2">
                      <div className="flex items-center justify-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        교사
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">사용자 관리</td>
                    <td className="text-center p-2">✅ 전체</td>
                    <td className="text-center p-2">📋 협회내</td>
                    <td className="text-center p-2">❌</td>
                    <td className="text-center p-2">❌</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">협회 관리</td>
                    <td className="text-center p-2">✅ 전체</td>
                    <td className="text-center p-2">📋 소속만</td>
                    <td className="text-center p-2">👀 읽기</td>
                    <td className="text-center p-2">👀 읽기</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">신고 관리</td>
                    <td className="text-center p-2">✅ 전체</td>
                    <td className="text-center p-2">📋 협회내</td>
                    <td className="text-center p-2">📋 할당받은</td>
                    <td className="text-center p-2">📝 본인</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">상담 관리</td>
                    <td className="text-center p-2">✅ 전체</td>
                    <td className="text-center p-2">👀 읽기</td>
                    <td className="text-center p-2">✅ 답변</td>
                    <td className="text-center p-2">📝 요청</td>
                  </tr>
                  <tr>
                    <td className="p-2">시스템 설정</td>
                    <td className="text-center p-2">✅ 전체</td>
                    <td className="text-center p-2">❌</td>
                    <td className="text-center p-2">❌</td>
                    <td className="text-center p-2">❌</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <p>✅ 전체 권한 | 📋 제한된 관리 권한 | 📝 생성 권한 | 👀 읽기 권한 | ❌ 권한 없음</p>
            </div>
          </CardContent>
        </Card>

        {/* 메인 사용자 관리 컴포넌트 */}
        <UserManager />

        {/* 관리 도구 */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>일괄 작업</CardTitle>
              <CardDescription>
                여러 사용자에 대한 일괄 작업을 수행합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                사용자 데이터 내보내기
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                역할 일괄 변경
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <UserCheck className="h-4 w-4 mr-2" />
                승인 상태 일괄 변경
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>시스템 통계</CardTitle>
              <CardDescription>
                사용자 관련 주요 지표를 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>이번 주 신규 가입:</span>
                <span className="font-semibold">12명</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>미승인 계정:</span>
                <span className="font-semibold text-amber-600">3명</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>비활성 계정:</span>
                <span className="font-semibold text-red-600">7명</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>마지막 로그인 (30일 전):</span>
                <span className="font-semibold">15명</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}