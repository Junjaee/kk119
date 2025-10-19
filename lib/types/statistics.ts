/**
 * @SPEC:STATS-001
 * 통계 및 대시보드 타입 정의
 */

export type DateRangeType = 'day' | 'week' | 'month' | 'year' | 'custom';
export type ExportFormat = 'csv' | 'json' | 'pdf' | 'excel';
export type ComparisonMetric = 'count' | 'rate' | 'average' | 'total';

export interface DateRange {
  start: Date;
  end: Date;
}

// 신고 통계
export interface ReportStatistics {
  totalReports: number;
  dailyReports: DailyCount[];
  byCategory: CategoryDistribution[];
  byStatus: StatusDistribution[];
  byPriority: PriorityDistribution[];
  averageResolutionHours: number;
  resolutionRate: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface PriorityDistribution {
  priority: string;
  count: number;
  percentage: number;
}

// 상담 통계
export interface ConsultationStatistics {
  totalConsultations: number;
  activeConsultations: number;
  completedCount: number;
  completionRate: number;
  byLawyer: LawyerStatistics[];
  matchingMetrics: MatchingMetrics;
  satisfaction: SatisfactionMetrics;
  averageRating: number | null;
}

export interface LawyerStatistics {
  lawyerId: number;
  lawyerName: string;
  assignedCount: number;
  completedCount: number;
  averageRating: number;
  responseTimeMinutes: number;
}

export interface MatchingMetrics {
  averageMatchingMinutes: number;
  matchingSuccessRate: number;
  rematchRate: number;
}

export interface SatisfactionMetrics {
  averageRating: number;
  ratingDistribution: RatingDistribution[];
  feedbackCount: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

// 시스템 통계
export interface SystemStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: UserRoleDistribution;
  performance: PerformanceMetrics;
  engagement: EngagementMetrics;
}

export interface UserRoleDistribution {
  admin: number;
  teacher: number;
  lawyer: number;
  super_admin: number;
}

export interface PerformanceMetrics {
  averageResponseTimeMs: number;
  uptime: number; // percentage
  errorRate: number; // percentage
  apiCallsPerDay: number;
}

export interface EngagementMetrics {
  averageSessionDurationMinutes: number;
  pageViews: number;
  bounceRate: number;
  retentionRate: number;
}

// KPI 대시보드
export interface KPIDashboard {
  monthlyReports: number;
  monthlyReportsTarget: number;
  completionRate: number;
  completionRateTarget: number;
  responseTime: number;
  responseTimeTarget: number;
  userSatisfaction: number;
  userSatisfactionTarget: number;
  achievementRates?: Record<string, number>;
  trends?: KPITrend[];
}

export interface KPITrend {
  date: string;
  value: number;
  target: number;
}

// 캐시 통계
export interface StatisticsCache {
  id: number;
  stat_type: string;
  date_range: string;
  filters: Record<string, any>;
  data: any;
  calculated_at: Date;
  expires_at: Date;
}

// 집계 데이터
export interface ReportAggregate {
  id: number;
  date: string;
  total_count: number;
  by_category: CategoryDistribution[];
  by_status: StatusDistribution[];
  by_priority: PriorityDistribution[];
  avg_resolution_hours: number;
  created_at: Date;
}

export interface ConsultationAggregate {
  id: number;
  date: string;
  total_count: number;
  completed_count: number;
  avg_matching_minutes: number;
  avg_rating: number;
  by_lawyer: LawyerStatistics[];
  created_at: Date;
}

// 필터
export interface StatisticsFilter {
  category?: string;
  status?: string;
  priority?: string;
  lawyerId?: number;
  teacherId?: number;
  dateRange?: DateRange;
}

export interface FilterOptions {
  categories: string[];
  statuses: string[];
  priorities: string[];
  lawyers?: LawyerInfo[];
  teachers?: TeacherInfo[];
}

export interface LawyerInfo {
  id: number;
  name: string;
}

export interface TeacherInfo {
  id: number;
  name: string;
}

// Export
export interface ExportOptions {
  format: ExportFormat;
  dateRange: DateRange;
  filters?: StatisticsFilter;
  includeCharts?: boolean;
  columns?: string[];
}

export interface ExportResult {
  id: string;
  format: ExportFormat;
  fileName: string;
  filePath: string;
  fileSize: number;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// 기간 비교
export interface ComparisonResult {
  period1: any;
  period2: any;
  difference: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
}

// 요약 대시보드
export interface DashboardSummary {
  reports: ReportStatistics;
  consultations: ConsultationStatistics;
  system: SystemStatistics;
  kpis: KPIDashboard;
  lastUpdated: Date;
}

// 일별 집계 결과
export interface DailyAggregationResult {
  date: string;
  reportCount: number;
  consultationCount: number;
  reportAggregate: ReportAggregate | null;
  consultationAggregate: ConsultationAggregate | null;
  success: boolean;
  error?: string;
}

// 실시간 업데이트 이벤트
export interface RealtimeUpdateEvent {
  type: 'report_created' | 'consultation_updated' | 'stats_updated';
  timestamp: Date;
  data: any;
}
