// @CODE:REPORT-NUMBER-001 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001 -> TEST-REPORT-NUMBER-001
// Report number generation service

import Database from 'better-sqlite3';

/**
 * Generate unique report number in format: RPT-YYYYMMDD-XXXX
 * @CODE:REPORT-NUMBER-001-GEN
 */
export function generateReportNumber(db: Database.Database): string {
  if (!db) {
    throw new Error('Database instance is required');
  }

  try {
    // Get current date in YYYYMMDD format
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Count reports created today
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM reports
      WHERE DATE(created_at) = DATE('now')
    `);

    const result = stmt.get() as { count: number };
    const count = result?.count || 0;

    // Generate sequence number with leading zeros (4 digits)
    const sequence = String(count + 1).padStart(4, '0');

    return `RPT-${today}-${sequence}`;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate report number: ${error.message}`);
    }
    throw error;
  }
}
