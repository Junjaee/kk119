import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdminAuth } from '@/lib/auth/api-middleware';
import { getAllAdminUsers, syncAllAdminUsers } from '@/lib/db/admin-sync';

// GET /api/admin/sync-admin-records - Check admin data consistency
async function checkAdminConsistency(request: NextRequest, authResult: any) {
  try {
    const adminUsers = getAllAdminUsers();

    const inconsistentUsers = adminUsers.filter(user => !user.admin_record);
    const consistentUsers = adminUsers.filter(user => user.admin_record);

    return NextResponse.json({
      message: 'Admin data consistency check completed',
      summary: {
        total_admin_users: adminUsers.length,
        consistent_users: consistentUsers.length,
        inconsistent_users: inconsistentUsers.length,
        consistency_rate: adminUsers.length > 0 ?
          Math.round((consistentUsers.length / adminUsers.length) * 100) : 100
      },
      consistent_users: consistentUsers.map(user => ({
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        association_id: user.association_id,
        admin_record_id: user.admin_record?.id,
        has_permissions: !!user.admin_record?.permissions
      })),
      inconsistent_users: inconsistentUsers.map(user => ({
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        association_id: user.association_id,
        missing: 'admin_record'
      }))
    });
  } catch (error) {
    console.error('Admin consistency check error:', error);
    return NextResponse.json(
      { error: 'Failed to check admin data consistency' },
      { status: 500 }
    );
  }
}

// POST /api/admin/sync-admin-records - Sync admin records
async function syncAdminRecords(request: NextRequest, authResult: any) {
  try {
    const result = syncAllAdminUsers();

    return NextResponse.json({
      message: 'Admin records synchronization completed',
      result: {
        total_processed: result.total,
        newly_synced: result.synced,
        already_synced: result.skipped,
        errors: result.errors
      },
      success: result.errors.length === 0
    });
  } catch (error) {
    console.error('Admin sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync admin records' },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(checkAdminConsistency);
export const POST = withSuperAdminAuth(syncAdminRecords);