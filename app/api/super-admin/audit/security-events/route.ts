import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdminAuth } from '../../../../../lib/auth/api-middleware';
import { getAuditLogger } from '../../../../../lib/audit/audit-logger';

// GET /api/super-admin/audit/security-events - Get security events
async function getSecurityEvents(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event_type = searchParams.get('event_type');
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const auditLogger = getAuditLogger();

    const filters: any = {
      limit,
      offset
    };

    if (event_type) filters.event_type = event_type;
    if (severity) filters.severity = severity;
    if (resolved !== null) filters.resolved = resolved === 'true';
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const events = auditLogger.getSecurityEvents(filters);

    // Get total count for pagination
    const totalCountQuery = auditLogger.getSecurityEvents({
      ...filters,
      limit: undefined,
      offset: undefined
    });
    const total = totalCountQuery.length;

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get security events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security events' },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/audit/security-events - Resolve security event
async function resolveSecurityEvent(request: NextRequest, authResult: any) {
  try {
    const body = await request.json();
    const { event_id, resolved, notes } = body;

    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const auditLogger = getAuditLogger();
    const userId = authResult.user?.id;

    // Update security event
    const db = (auditLogger as any).db;
    const updateStmt = db.prepare(`
      UPDATE security_events
      SET resolved = ?, resolved_by = ?, resolved_at = datetime('now')
      WHERE id = ?
    `);

    updateStmt.run(resolved ? 1 : 0, userId, event_id);

    // Log the resolution action
    await auditLogger.logAuditEvent({
      user_id: userId,
      action: 'security_event_resolve',
      resource: 'security_events',
      resource_id: event_id.toString(),
      details: `Security event ${resolved ? 'resolved' : 'reopened'}${notes ? `: ${notes}` : ''}`,
      success: true
    });

    return NextResponse.json({
      message: `Security event ${resolved ? 'resolved' : 'reopened'} successfully`
    });
  } catch (error) {
    console.error('Resolve security event error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve security event' },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(getSecurityEvents);
export const POST = withSuperAdminAuth(resolveSecurityEvent);