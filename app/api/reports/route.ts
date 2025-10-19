// @CODE:REPORT-API-001 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001
// Report API endpoints for list and create operations

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify-token';
import db from '@/lib/db/database';
import { ReportService } from '@/lib/services/report-service';
import { CreateReportData } from '@/lib/types/report';

const reportService = new ReportService(db);

/**
 * GET /api/reports - List reports with role-based filtering
 * @CODE:REPORT-API-001-LIST
 */
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Get reports based on role
    let reports;
    if (user.role === 'admin' || user.role === 'super_admin') {
      reports = await reportService.getAllReports(user.role);
    } else {
      reports = await reportService.getReportsByUser(user.id, user.role);
    }

    // Apply filters if provided
    if (status) {
      reports = reports.filter((r: any) => r.status === status);
    }
    if (category) {
      reports = reports.filter((r: any) => r.category === category);
    }

    return NextResponse.json({
      success: true,
      data: reports,
      count: reports.length,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports - Create new report
 * @CODE:REPORT-API-001-CREATE
 */
export async function POST(request: NextRequest) {
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

    // Only teachers can create reports
    if (user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can create reports' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const reportData: CreateReportData = {
      category: body.category,
      title: body.title,
      description: body.description,
      incident_date: body.incident_date,
      location: body.location,
      witness_count: body.witness_count,
      is_emergency: body.is_emergency || false,
    };

    // Create report
    const report = await reportService.createReport(user.id, reportData);

    return NextResponse.json(
      {
        success: true,
        data: report,
        message: 'Report created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating report:', error);

    // Handle validation errors
    if (error instanceof Error) {
      if (error.message.includes('required') ||
          error.message.includes('Invalid') ||
          error.message.includes('cannot exceed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
