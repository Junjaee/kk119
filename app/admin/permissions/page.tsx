'use client';

export const dynamic = 'force-dynamic';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PermissionMatrix } from '@/components/admin/permission-matrix';
import { AuthGuard, RoleGuard } from '@/components/auth/permission-guard';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PermissionsPage() {
  return (
    <AuthGuard>
      <RoleGuard
        roles={['super_admin', 'admin']}
        fallback={
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
            <p className="text-muted-foreground">
              이 페이지는 관리자만 접근할 수 있습니다.
            </p>
          </div>
        }
      >
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
                <h1 className="text-3xl font-bold">권한 매트릭스</h1>
                <p className="text-muted-foreground">
                  4-tier 사용자 역할별 시스템 권한을 확인하고 관리합니다
                </p>
              </div>
            </div>

            {/* 권한 매트릭스 컴포넌트 */}
            <PermissionMatrix />
          </div>
        </DashboardLayout>
      </RoleGuard>
    </AuthGuard>
  );
}