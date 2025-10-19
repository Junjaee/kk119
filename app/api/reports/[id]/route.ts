// @CODE:REPORT-API-002 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001
// Report API endpoints for individual report operations

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify-token';
import db from '@/lib/db/database';
import { ReportService } from '@/lib/services/report-service';
import { UpdateReportData } from '@/lib/types/report';

const reportService = new ReportService(db);

/**
 * GET /api/reports/[id] - Get report by ID
 * @CODE:REPORT-API-002-GET
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

    // Get report with access control
    const report = await reportService.getReportById(reportId, user.id, user.role);

    // Get status history
    const statusHistory = await reportService.getStatusHistory(reportId);

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        statusHistory,
      },
    });
  } catch (error) {
    console.error('Error fetching report:', error);

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

/**
 * PATCH /api/reports/[id] - Update report
 * @CODE:REPORT-API-002-UPDATE
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
    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const updateData: UpdateReportData = {
      title: body.title,
      description: body.description,
      incident_date: body.incident_date,
      location: body.location,
      witness_count: body.witness_count,
      is_emergency: body.is_emergency,
    };

    // Update report
    const report = await reportService.updateReport(
      reportId,
      user.id,
      user.role,
      updateData
    );

    return NextResponse.json({
      success: true,
      data: report,
      message: 'Report updated successfully',
    });
  } catch (error) {
    console.error('Error updating report:', error);

    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      if (error.message.includes('Cannot update')) {
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
 * DELETE /api/reports/[id] - Delete report (not allowed)
 * @CODE:REPORT-API-002-DELETE
 */
export async function DELETE(
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

    // Attempt to delete (will be rejected by service)
    await reportService.deleteReport(reportId, user.id, user.role);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting report:', error);

    if (error instanceof Error && error.message.includes('cannot be deleted')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
