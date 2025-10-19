// @CODE:REPORT-TYPES-001 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001
// Report type definitions

export type ReportCategory = '학부모 민원' | '학생 폭력' | '명예훼손';

export type ReportStatus = 'received' | 'reviewing' | 'consulting' | 'completed';

export interface CreateReportData {
  category: ReportCategory;
  title: string;
  description: string;
  incident_date: string;
  location: string;
  witness_count?: number;
  is_emergency?: boolean;
}

export interface Report {
  id: number;
  report_number: string;
  teacher_id: number;
  category: ReportCategory;
  title: string;
  description: string;
  incident_date: string;
  location: string;
  witness_count?: number;
  is_emergency: boolean;
  status: ReportStatus;
  lawyer_id?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ReportStatusHistory {
  id: number;
  report_id: number;
  from_status: ReportStatus | null;
  to_status: ReportStatus;
  changed_by: number;
  changed_at: string;
  note?: string;
}

export interface UpdateReportData {
  title?: string;
  description?: string;
  incident_date?: string;
  location?: string;
  witness_count?: number;
  is_emergency?: boolean;
}

// Validation constants
export const REPORT_CONSTRAINTS = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 2000,
  VALID_CATEGORIES: ['학부모 민원', '학생 폭력', '명예훼손'] as const,
  VALID_STATUSES: ['received', 'reviewing', 'consulting', 'completed'] as const,
};

// Validation helpers
export function isValidReportCategory(category: string): category is ReportCategory {
  return REPORT_CONSTRAINTS.VALID_CATEGORIES.includes(category as any);
}

export function isValidReportStatus(status: string): status is ReportStatus {
  return REPORT_CONSTRAINTS.VALID_STATUSES.includes(status as any);
}
