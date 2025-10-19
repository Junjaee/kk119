// @CODE:REPORT-SERVICE-001 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001 -> TEST-REPORT-CRUD-001
// Report service with CRUD operations and role-based access control

import Database from 'better-sqlite3';
import { generateReportNumber } from './report-number-service';
import { ReportStateMachine } from './report-state-machine';
import {
  Report,
  ReportStatus,
  ReportStatusHistory,
  CreateReportData,
  UpdateReportData,
  REPORT_CONSTRAINTS,
  isValidReportCategory,
} from '@/lib/types/report';
import { UserRole } from '@/lib/types';

/**
 * Service for managing report CRUD operations
 * @CODE:REPORT-SERVICE-001-MAIN
 */
export class ReportService {
  private db: Database.Database;
  private stateMachine: ReportStateMachine;

  constructor(db: Database.Database) {
    this.db = db;
    this.stateMachine = new ReportStateMachine();
  }

  /**
   * Create a new report
   * @CODE:REPORT-SERVICE-001-CREATE
   */
  async createReport(teacherId: number, data: CreateReportData): Promise<Report> {
    // Validate input
    this.validateCreateData(data);

    // Generate unique report number
    const reportNumber = generateReportNumber(this.db);

    // Insert report
    const stmt = this.db.prepare(`
      INSERT INTO reports (
        report_number, teacher_id, category, title, description,
        incident_date, location, witness_count, is_emergency, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'received')
    `);

    const result = stmt.run(
      reportNumber,
      teacherId,
      data.category,
      data.title,
      data.description,
      data.incident_date,
      data.location,
      data.witness_count || null,
      data.is_emergency ? 1 : 0
    );

    // Fetch and return created report
    return this.getReportByIdInternal(result.lastInsertRowid as number);
  }

  /**
   * Get all reports (admin only)
   * @CODE:REPORT-SERVICE-001-GET-ALL
   */
  async getAllReports(userRole: UserRole): Promise<Report[]> {
    if (!this.isAdminRole(userRole)) {
      throw new Error('Access denied: Only admins can view all reports');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM reports
      ORDER BY created_at DESC
    `);

    return stmt.all() as Report[];
  }

  /**
   * Get reports by user (teacher sees only their own)
   * @CODE:REPORT-SERVICE-001-GET-BY-USER
   */
  async getReportsByUser(userId: number, userRole: UserRole): Promise<Report[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM reports
      WHERE teacher_id = ?
      ORDER BY created_at DESC
    `);

    return stmt.all(userId) as Report[];
  }

  /**
   * Get report by ID with access control
   * @CODE:REPORT-SERVICE-001-GET-BY-ID
   */
  async getReportById(
    reportId: number,
    userId: number,
    userRole: UserRole
  ): Promise<Report> {
    const report = this.getReportByIdInternal(reportId);

    // Check access permissions
    if (!this.canAccessReport(report, userId, userRole)) {
      throw new Error('Access denied: You cannot view this report');
    }

    return report;
  }

  /**
   * Update report with access control
   * @CODE:REPORT-SERVICE-001-UPDATE
   */
  async updateReport(
    reportId: number,
    userId: number,
    userRole: UserRole,
    data: UpdateReportData
  ): Promise<Report> {
    const report = this.getReportByIdInternal(reportId);

    // Check access permissions
    if (!this.canAccessReport(report, userId, userRole)) {
      throw new Error('Access denied: You cannot update this report');
    }

    // Check if report can be updated based on status
    if (report.status === 'completed') {
      throw new Error('Cannot update completed report');
    }

    // Teachers can only update reports in 'received' status
    if (userRole === 'teacher' && report.status !== 'received') {
      throw new Error('Cannot update report in current status');
    }

    // Validate update data
    this.validateUpdateData(data);

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.incident_date !== undefined) {
      updates.push('incident_date = ?');
      values.push(data.incident_date);
    }
    if (data.location !== undefined) {
      updates.push('location = ?');
      values.push(data.location);
    }
    if (data.witness_count !== undefined) {
      updates.push('witness_count = ?');
      values.push(data.witness_count);
    }
    if (data.is_emergency !== undefined) {
      updates.push('is_emergency = ?');
      values.push(data.is_emergency ? 1 : 0);
    }

    if (updates.length === 0) {
      return report;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(reportId);

    const stmt = this.db.prepare(`
      UPDATE reports
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.getReportByIdInternal(reportId);
  }

  /**
   * Delete report (not allowed per business rules)
   * @CODE:REPORT-SERVICE-001-DELETE
   */
  async deleteReport(reportId: number, userId: number, userRole: UserRole): Promise<void> {
    throw new Error('Reports cannot be deleted for preservation requirements');
  }

  /**
   * Update report status with validation
   * @CODE:REPORT-SERVICE-001-UPDATE-STATUS
   */
  async updateReportStatus(
    reportId: number,
    newStatus: ReportStatus,
    changedBy: number,
    note?: string
  ): Promise<Report> {
    const report = this.getReportByIdInternal(reportId);

    // Validate state transition
    if (!this.stateMachine.canTransition(report.status, newStatus)) {
      throw new Error(
        `Invalid status transition from ${report.status} to ${newStatus}`
      );
    }

    // Update report status
    const updateStmt = this.db.prepare(`
      UPDATE reports
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(newStatus, reportId);

    // Record status history
    const historyStmt = this.db.prepare(`
      INSERT INTO report_status_history (report_id, from_status, to_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `);

    historyStmt.run(reportId, report.status, newStatus, changedBy, note || null);

    return this.getReportByIdInternal(reportId);
  }

  /**
   * Get status change history for a report
   * @CODE:REPORT-SERVICE-001-STATUS-HISTORY
   */
  async getStatusHistory(reportId: number): Promise<ReportStatusHistory[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM report_status_history
      WHERE report_id = ?
      ORDER BY changed_at ASC
    `);

    return stmt.all(reportId) as ReportStatusHistory[];
  }

  /**
   * Internal method to get report by ID without access control
   * @CODE:REPORT-SERVICE-001-GET-INTERNAL
   */
  private getReportByIdInternal(reportId: number): Report {
    const stmt = this.db.prepare('SELECT * FROM reports WHERE id = ?');
    const report = stmt.get(reportId) as Report | undefined;

    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    return report;
  }

  /**
   * Check if user can access report
   * @CODE:REPORT-SERVICE-001-CAN-ACCESS
   */
  private canAccessReport(report: Report, userId: number, userRole: UserRole): boolean {
    // Admins can access all reports
    if (this.isAdminRole(userRole)) {
      return true;
    }

    // Lawyers can access reports assigned to them
    if (userRole === 'lawyer' && report.lawyer_id === userId) {
      return true;
    }

    // Teachers can only access their own reports
    if (userRole === 'teacher' && report.teacher_id === userId) {
      return true;
    }

    return false;
  }

  /**
   * Check if user role is admin
   * @CODE:REPORT-SERVICE-001-IS-ADMIN
   */
  private isAdminRole(role: UserRole): boolean {
    return role === 'admin' || role === 'super_admin';
  }

  /**
   * Validate create report data
   * @CODE:REPORT-SERVICE-001-VALIDATE-CREATE
   */
  private validateCreateData(data: CreateReportData): void {
    if (!data.category || !isValidReportCategory(data.category)) {
      throw new Error(`Invalid category: ${data.category}`);
    }

    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    if (data.title.length > REPORT_CONSTRAINTS.TITLE_MAX_LENGTH) {
      throw new Error(
        `Title cannot exceed ${REPORT_CONSTRAINTS.TITLE_MAX_LENGTH} characters`
      );
    }

    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (data.description.length > REPORT_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
      throw new Error(
        `Description cannot exceed ${REPORT_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters`
      );
    }

    if (!data.incident_date) {
      throw new Error('Incident date is required');
    }

    if (!data.location || data.location.trim().length === 0) {
      throw new Error('Location is required');
    }
  }

  /**
   * Validate update report data
   * @CODE:REPORT-SERVICE-001-VALIDATE-UPDATE
   */
  private validateUpdateData(data: UpdateReportData): void {
    if (data.title !== undefined) {
      if (data.title.trim().length === 0) {
        throw new Error('Title cannot be empty');
      }
      if (data.title.length > REPORT_CONSTRAINTS.TITLE_MAX_LENGTH) {
        throw new Error(
          `Title cannot exceed ${REPORT_CONSTRAINTS.TITLE_MAX_LENGTH} characters`
        );
      }
    }

    if (data.description !== undefined) {
      if (data.description.trim().length === 0) {
        throw new Error('Description cannot be empty');
      }
      if (data.description.length > REPORT_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
        throw new Error(
          `Description cannot exceed ${REPORT_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters`
        );
      }
    }
  }
}
