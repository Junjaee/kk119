'use client';

export const dynamic = 'force-dynamic';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AssociationManager } from '@/components/admin/association-manager';
import { AuthGuard, RoleGuard } from '@/components/auth/permission-guard';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AssociationsPage() {
  return (
    <AuthGuard>
      <RoleGuard
        roles={['super_admin']}
        fallback={
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
            <p className="text-muted-foreground">
              이 페이지는 슈퍼어드민만 접근할 수 있습니다.
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
                <h1 className="text-3xl font-bold">협회 관리</h1>
                <p className="text-muted-foreground">
                  교원 단체 및 협회를 관리하고 멤버십을 제어합니다
                </p>
              </div>
            </div>

            {/* 협회 관리 컴포넌트 */}
            <AssociationManager />
          </div>
        </DashboardLayout>
      </RoleGuard>
    </AuthGuard>
  );
}