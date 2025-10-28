/**
 * @SPEC:CONSULT-001
 * 변호사 워크로드 조회 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { LawyerWorkloadService } from '@/lib/services/lawyer-workload-service';
import { getServerSession } from '@/lib/auth/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workloadService = new LawyerWorkloadService();

    try {
      // lawyerId 파라미터 처리
      let lawyerIds: number[] = [];

      const lawyerIdParam = searchParams.get('lawyerId');
      const multipleIds = searchParams.get('lawyerIds');

      if (multipleIds) {
        // 여러 변호사 ID
        lawyerIds = multipleIds.split(',').map(id => parseInt(id));
      } else if (lawyerIdParam) {
        // 단일 변호사 ID
        lawyerIds = [parseInt(lawyerIdParam)];
      } else if (session.user.role === 'lawyer') {
        // 변호사 본인의 워크로드
        lawyerIds = [session.user.id];
      } else if (session.user.role === 'admin' || session.user.role === 'admin') {
        // 관리자는 모든 변호사 워크로드 조회 가능
        const workloads = await workloadService.getAllWorkloads();
        const stats = await workloadService.getWorkloadStats();

        return NextResponse.json({
          workloads,
          stats,
        });
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 지정된 변호사들의 워크로드 조회
      const workloads = await workloadService.getMultipleWorkloads(lawyerIds);

      // 권한 확인 - 변호사는 본인 것만
      if (session.user.role === 'lawyer') {
        const filteredWorkloads = workloads.filter(
          w => w.lawyerId === session.user.id
        );

        if (filteredWorkloads.length === 0) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({
          workload: filteredWorkloads[0],
        });
      }

      // 관리자는 요청한 모든 워크로드 반환
      return NextResponse.json({
        workloads,
      });
    } finally {
      workloadService.close();
    }
  } catch (error) {
    console.error('Error fetching workload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}