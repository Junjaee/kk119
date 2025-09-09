// User Types
export type UserRole = 'teacher' | 'lawyer' | 'admin';

export interface User {
  id: string | number;
  email: string;
  name?: string;
  nickname?: string;
  role?: UserRole;
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
export type ReportStatus = 'received' | 'reviewing' | 'consulting' | 'completed';

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
}

// Consult Types
export interface Consult {
  id: string;
  report_id: string;
  lawyer_id: string;
  content: string;
  created_at: string;
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