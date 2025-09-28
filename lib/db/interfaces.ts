/**
 * Database interfaces following Interface Segregation Principle
 * Each interface has a focused responsibility
 */

import { ReportStatusType, CommunityCategoryType } from './constants';

// Core entity interfaces
export interface Report {
  id: string;
  type: string;
  title: string;
  incident_date: string;
  incident_time: string;
  location: string;
  witnesses: string;
  content: string;
  desired_action: string;
  status: ReportStatusType;
  createdAt: string;
  updatedAt: string;
  fileNames?: string[];
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  category: CommunityCategoryType;
  likes: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: string;
  authorId: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
}

// Report repository interface
export interface IReportRepository {
  getAllReports(): Promise<Report[]>;
  getReportById(id: string): Promise<Report | null>;
  createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Report | null>;
  updateReport(id: string, updates: Partial<Omit<Report, 'id' | 'createdAt'>>): Promise<Report | null>;
  deleteReport(id: string): Promise<boolean>;
  getReportsByStatus(status: ReportStatusType): Promise<Report[]>;
  getReportsCountByStatus(): Promise<{ pending: number; processing: number; resolved: number; rejected: number }>;
}

// Community post repository interface
export interface ICommunityPostRepository {
  getAllPosts(): Promise<CommunityPost[]>;
  getPostById(id: string): Promise<CommunityPost | null>;
  createPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<CommunityPost | null>;
  updatePost(id: string, updates: Partial<Omit<CommunityPost, 'id' | 'createdAt'>>): Promise<CommunityPost | null>;
  togglePostLike(postId: string, userId: string): Promise<CommunityPost | null>;
  deletePost(id: string): Promise<boolean>;
}

// Comment repository interface
export interface ICommentRepository {
  getAllComments(): Promise<Comment[]>;
  getCommentsByPostId(postId: string): Promise<Comment[]>;
  createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<Comment | null>;
  toggleCommentLike(commentId: string, userId: string): Promise<Comment | null>;
  deleteComment(id: string): Promise<boolean>;
}

// User context interface
export interface IUserContext {
  getUserId(): string | undefined;
  getAssociationId(): string | undefined;
}

// Database configuration interface
export interface IDatabaseConfig {
  shouldUseSupabase(): boolean;
  isMigrationCompleted(): boolean;
  markMigrationCompleted(): void;
  resetMigrationStatus(): void;
}

// Unified database interface following Dependency Inversion Principle
export interface IUnifiedDatabase extends IReportRepository, ICommunityPostRepository, ICommentRepository {
  initWithSampleData(): Promise<void>;
  getCurrentMode(): 'localStorage' | 'supabase';
  testConnection(): Promise<{ localStorage: boolean; supabase: boolean }>;
}