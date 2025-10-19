// @CODE:REPORT-API-003 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001
// Report status update API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify-token';
import db from '@/lib/db/database';
import { ReportService } from '@/lib/services/report-service';
import { ReportStatus, isValidReportStatus } from '@/lib/types/report';

const reportService = new ReportService(db);

/**
 * PATCH /api/reports/[id]/status - Update report status
 * @CODE:REPORT-API-003-UPDATE-STATUS
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = authResult;

    // Only admins can change report status
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only administrators can change report status' },
        { status: 403 }
      );
    }

    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status, note } = body;

    // Validate status
    if (!status || !isValidReportStatus(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 422 }
      );
    }

    // Update report status
    const report = await reportService.updateReportStatus(
      reportId,
      status as ReportStatus,
      user.id,
      note
    );

    return NextResponse.json({
      success: true,
      data: report,
      message: `Report status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating report status:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid status transition')) {
        return NextResponse.json(
          { error: error.message },
          { status: 422 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/[id]/status - Get status history
 * @CODE:REPORT-API-003-GET-HISTORY
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = authResult;
    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // Verify user has access to this report
    await reportService.getReportById(reportId, user.id, user.role);

    // Get status history
    const history = await reportService.getStatusHistory(reportId);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching status history:', error);

    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
