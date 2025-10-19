// @CODE:CONSULT-TYPES-001 | Chain: SPEC-CONSULT-001 -> TEST-CONSULT-001 -> CODE-CONSULT-001
// Related: @CODE:CONSULT-CONST-001, @CODE:CONSULT-SERVICE-001

/**
 * Consultation status flow (IMMUTABLE after assignment)
 * pending -> assigned (by lawyer selection) -> in_progress -> completed -> closed
 *
 * Special states:
 * - cancelled: Teacher cancels (only from pending)
 * - expired: 30 days without assignment
 */
export type ConsultStatus =
  | 'pending' // Waiting for lawyer selection
  | 'assigned' // Lawyer selected (IMMUTABLE)
  | 'in_progress' // Lawyer actively working
  | 'completed' // Consultation finished
  | 'closed' // Evaluation done, fully closed
  | 'cancelled' // Teacher cancelled (only from pending)
  | 'expired'; // Auto-expired after 30 days

/**
 * Consultation urgency levels
 * Priority: urgent > high > normal > low
 */
export type ConsultUrgency = 'urgent' | 'high' | 'normal' | 'low';

/**
 * Consultation category types based on teacher issue domains
 */
export type ConsultCategory =
  | '학부모 민원' // Parent complaints
  | '학생 폭력' // Student violence
  | '교권침해' // Teacher rights violation
  | '행정 관련' // Administrative matters
  | '기타'; // Others

export interface Consult {
  id: number;
  consult_no: string;
  teacher_id: number;
  lawyer_id?: number;
  report_id?: number;
  title: string;
  content: string;
  category: ConsultCategory;
  urgency: ConsultUrgency;
  status: ConsultStatus;
  matched_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsultMessage {
  id: number;
  consult_id: number;
  sender_id: number;
  sender_role: 'teacher' | 'lawyer' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface LawyerSpecialty {
  id: number;
  lawyer_id: number;
  specialty: ConsultCategory;
  is_primary: boolean;
}

export interface ConsultEvaluation {
  id: number;
  consult_id: number;
  rating: number; // 1-5
  feedback?: string;
  created_at: string;
}

/**
 * Lawyer workload information
 */
export interface LawyerWorkload {
  lawyer_id: number;
  active_count: number; // Currently active consultations
  max_capacity: number; // Always 10
  available_slots: number; // max_capacity - active_count
  is_full: boolean; // active_count >= 10
}

export interface CreateConsultInput {
  teacher_id: number;
  report_id?: number;
  title: string;
  content: string;
  category: ConsultCategory;
  urgency?: ConsultUrgency;
}

export interface UpdateConsultInput {
  title?: string;
  content?: string;
  category?: ConsultCategory;
  urgency?: ConsultUrgency;
}

/**
 * Message sender role
 */
export type MessageSenderRole = 'teacher' | 'lawyer' | 'admin';

/**
 * Available consultation for lawyer selection
 */
export interface AvailableConsultation extends Consult {
  teacher_name?: string; // Anonymized or masked
  specialty_match?: boolean; // Matches lawyer's specialty
}

/**
 * Consultation selection filters
 */
export interface ConsultationFilters {
  specialty?: ConsultCategory;
  urgency?: ConsultUrgency;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

/**
 * Consultation selection result
 */
export interface SelectionResult {
  success: boolean;
  consult: Consult;
  message?: string;
}

/**
 * Status transition validation
 */
export const VALID_STATUS_TRANSITIONS: Record<ConsultStatus, ConsultStatus[]> = {
  pending: ['assigned', 'cancelled', 'expired'],
  assigned: ['in_progress'], // IMMUTABLE - no going back
  in_progress: ['completed'],
  completed: ['closed'],
  closed: [], // Terminal state
  cancelled: [], // Terminal state
  expired: [], // Terminal state
};

/**
 * Active statuses for workload calculation
 */
export const ACTIVE_STATUSES: ConsultStatus[] = ['assigned', 'in_progress'];

/**
 * Validate status transition
 */
export function isValidStatusTransition(
  from: ConsultStatus,
  to: ConsultStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Check if status is terminal (cannot transition further)
 */
export function isTerminalStatus(status: ConsultStatus): boolean {
  return VALID_STATUS_TRANSITIONS[status]?.length === 0;
}

/**
 * Check if consultation is active (counts toward workload)
 */
export function isActiveConsultation(status: ConsultStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

// ===== NEW TYPES FOR LAWYER SELECTION SYSTEM =====

/**
 * Consultation status enum for better type safety
 */
export enum CONSULT_STATUS {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

/**
 * Consultation urgency enum
 */
export enum CONSULT_URGENCY {
  URGENT = 'urgent',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low'
}

/**
 * Maximum workload per lawyer
 */
export const MAX_WORKLOAD_PER_LAWYER = 10;

/**
 * Consultation entity
 */
export interface Consultation {
  id: number;
  consultNo: string;
  teacherId: number;
  lawyerId?: number | null;
  reportId?: number | null;
  title: string;
  content: string;
  category?: string | null;
  urgency: string;
  status: string;
  matchedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  evaluation?: {
    rating: number;
    feedback?: string;
  };
}

/**
 * Create consultation DTO
 */
export interface CreateConsultationDto {
  teacherId: number;
  reportId?: number;
  title: string;
  content: string;
  category?: string;
  urgency?: string;
}

/**
 * Update consultation DTO
 */
export interface UpdateConsultationDto {
  title?: string;
  content?: string;
  category?: string;
  urgency?: string;
}

/**
 * Consultation filter
 */
export interface ConsultationFilter {
  teacherId?: number;
  lawyerId?: number;
  status?: string;
  category?: string;
  urgency?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

/**
 * Available consultation for lawyers
 */
export interface AvailableConsultation {
  id: number;
  consultNo: string;
  teacherId: number;
  title: string;
  category?: string | null;
  urgency: string;
  createdAt: Date;
  isUrgent: boolean;
  waitingTime: number; // in minutes
  competingLawyers: number;
}

/**
 * Lawyer selection result
 */
export interface LawyerSelectionResult {
  success: boolean;
  consultId?: number;
  error?: string;
}

/**
 * Workload info
 */
export interface WorkloadInfo {
  lawyerId: number;
  currentLoad: number;
  maxLoad: number;
  availableSlots: number;
  isAvailable: boolean;
  consultations: Record<string, number>;
  categoryDistribution: Record<string, number>;
  urgencyDistribution: Record<string, number>;
}

/**
 * Message entity
 */
export interface Message {
  id: number;
  consultId: number;
  senderId: number;
  senderRole: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Create message DTO
 */
export interface CreateMessageDto {
  consultId: number;
  senderId: number;
  message: string;
}

/**
 * Message filter
 */
export interface MessageFilter {
  senderId?: number;
  senderRole?: string;
  isRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}
