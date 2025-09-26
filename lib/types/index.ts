// User Types
export type UserRole = 'super_admin' | 'admin' | 'lawyer' | 'teacher';

export interface User {
  id: string | number;
  email: string;
  name?: string;
  nickname?: string;
  role?: UserRole;
  association_id?: number;
  school?: string;
  position?: string;
  phone?: string;
  school_verified?: boolean;
  isAdmin?: boolean;
  isVerified?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

// Report Types
export type ReportType = 'parent' | 'student' | 'defamation' | 'other';
export type ReportStatus =
  | 'received'           // Initial report submission
  | 'reviewing'          // Under admin review
  | 'consulting'         // General consulting phase
  | 'lawyer_assigned'    // Lawyer has been assigned to case
  | 'lawyer_consulting'  // Lawyer is actively working on consultation
  | 'lawyer_responded'   // Lawyer has provided consultation response
  | 'completed';         // Case fully resolved

export interface Report {
  id: string;
  user_id: string;
  type: ReportType;
  title: string;
  content: string;
  incident_date: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  user?: User;
  consults?: Consult[];
  files?: ReportFile[];
  lawyer_assignment?: LawyerAssignment;
  requires_legal_consultation?: boolean;
}

// Lawyer Assignment Types
export type LawyerAssignmentStatus = 'unassigned' | 'assigned' | 'pending' | 'completed';
export type ConsultationStatus = 'pending' | 'in_progress' | 'completed' | 'closed';

export interface LawyerAssignment {
  id: string;
  report_id: string;
  lawyer_id?: string;
  status: LawyerAssignmentStatus;
  assigned_at?: string;
  assigned_by?: string; // admin user id who assigned the lawyer
  notes?: string;
  lawyer?: User;
  report?: Report;
}

// Consult Types
export interface Consult {
  id: string;
  report_id: string;
  lawyer_id: string;
  content: string;
  status: ConsultationStatus;
  created_at: string;
  updated_at?: string;
  lawyer?: User;
  report?: Report;
}

// Post Types
export type PostCategory = 'free' | 'case';

export interface Post {
  id: string;
  user_id: string;
  category: PostCategory;
  title: string;
  content: string;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  comments?: Comment[];
  likes?: Like[];
}

// Comment Types
export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_lawyer: boolean;
  created_at: string;
  user?: User;
}

// Like Types
export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// File Types
export interface ReportFile {
  id: string;
  report_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

// Notification Types
export type NotificationType = 'consult_reply' | 'comment' | 'announcement';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// Statistics Types
export interface Statistics {
  total_reports: number;
  pending_reports: number;
  completed_reports: number;
  total_users: number;
  total_lawyers: number;
  daily_reports: number;
  completion_rate: number;
  average_response_time: number;
}

// Type Guard Functions
export function isValidUserRole(role: string): role is UserRole {
  return ['super_admin', 'admin', 'lawyer', 'teacher'].includes(role);
}

export function isSuperAdmin(user: User): boolean {
  return user.role === 'super_admin';
}

export function isAdmin(user: User): boolean {
  return user.role === 'admin' || user.role === 'super_admin';
}

export function isLawyer(user: User): boolean {
  return user.role === 'lawyer';
}

export function isTeacher(user: User): boolean {
  return user.role === 'teacher';
}

export function hasRole(user: User, roles: UserRole[]): boolean {
  return user.role ? roles.includes(user.role) : false;
}

// Role hierarchy helper
export function getUserRoleHierarchy(role: UserRole): number {
  const hierarchy = {
    'super_admin': 4,
    'admin': 3,
    'lawyer': 2,
    'teacher': 1
  };
  return hierarchy[role] || 0;
}

export function canAccessRole(userRole: UserRole, targetRole: UserRole): boolean {
  return getUserRoleHierarchy(userRole) >= getUserRoleHierarchy(targetRole);
}

// Lawyer Assignment Helper Functions
export function isLawyerAssigned(assignment?: LawyerAssignment): boolean {
  return assignment?.status === 'assigned' && !!assignment.lawyer_id;
}

export function canAssignLawyer(user: User): boolean {
  return isAdmin(user);
}

export function isConsultationActive(consult?: Consult): boolean {
  return consult?.status === 'in_progress';
}

export function requiresLegalConsultation(report: Report): boolean {
  return report.requires_legal_consultation === true || report.type === 'defamation';
}

// Report Status Helper Functions
export function isReportInLawyerWorkflow(status: ReportStatus): boolean {
  return ['lawyer_assigned', 'lawyer_consulting', 'lawyer_responded'].includes(status);
}

export function canAssignLawyerToReport(status: ReportStatus): boolean {
  return ['reviewing', 'consulting'].includes(status);
}

export function isLawyerConsultationActive(status: ReportStatus): boolean {
  return status === 'lawyer_consulting';
}

export function isLawyerConsultationComplete(status: ReportStatus): boolean {
  return status === 'lawyer_responded';
}

export function getNextReportStatus(currentStatus: ReportStatus, action: 'assign_lawyer' | 'start_consultation' | 'complete_consultation' | 'finalize'): ReportStatus {
  switch (action) {
    case 'assign_lawyer':
      return canAssignLawyerToReport(currentStatus) ? 'lawyer_assigned' : currentStatus;
    case 'start_consultation':
      return currentStatus === 'lawyer_assigned' ? 'lawyer_consulting' : currentStatus;
    case 'complete_consultation':
      return currentStatus === 'lawyer_consulting' ? 'lawyer_responded' : currentStatus;
    case 'finalize':
      return 'completed';
    default:
      return currentStatus;
  }
}

export function getReportStatusLabel(status: ReportStatus): string {
  const labels: Record<ReportStatus, string> = {
    received: '접수완료',
    reviewing: '검토중',
    consulting: '상담진행',
    lawyer_assigned: '변호사 배정',
    lawyer_consulting: '변호사 상담중',
    lawyer_responded: '변호사 답변 완료',
    completed: '해결완료'
  };
  return labels[status] || status;
}

export function getReportStatusColor(status: ReportStatus): string {
  const colors: Record<ReportStatus, string> = {
    received: 'blue',
    reviewing: 'yellow',
    consulting: 'orange',
    lawyer_assigned: 'purple',
    lawyer_consulting: 'indigo',
    lawyer_responded: 'green',
    completed: 'emerald'
  };
  return colors[status] || 'gray';
}