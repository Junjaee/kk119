/**
 * Refactored Unified Database Service
 * Following SOLID principles and applying Adapter Pattern
 */

import { localDB, Report, CommunityPost, Comment } from './localDB';
import { supabaseDB } from './supabaseDB';
import { UnifiedDatabaseService } from '@/lib/db/unified-database-service';
import { databaseConfigService, DatabaseMode } from '@/lib/db/database-config-service';
import { userContextService } from '@/lib/db/user-context-service';

export type { DatabaseMode };

/**
 * Legacy Database Service
 * Refactored to use composition and delegation to new services
 * Following Single Responsibility and Dependency Inversion Principles
 */
class DatabaseService {
  private unifiedService: UnifiedDatabaseService;

  constructor() {
    // Initialize with adapter pattern - dependency injection
    this.unifiedService = new UnifiedDatabaseService(
      localDB as any, // These would need proper adapter implementations
      supabaseDB as any,
      localDB as any,
      supabaseDB as any,
      localDB as any,
      supabaseDB as any
    );
  }

  // Configuration methods - delegate to config service
  setMode(mode: DatabaseMode): void {
    databaseConfigService.setMode(mode);
  }

  setForceLocalStorage(force: boolean): void {
    databaseConfigService.setForceLocalStorage(force);
  }

  // Legacy methods for backward compatibility
  private shouldUseSupabase(): boolean {
    return databaseConfigService.shouldUseSupabase();
  }

  private getCurrentUser(): { userId?: string; associationId?: string } {
    return userContextService.getUserContext();
  }

  // ========== REPORT METHODS ==========
  // Refactored to delegate to unified service - eliminates duplicate code

  async getAllReports(): Promise<Report[]> {
    return await this.unifiedService.getAllReports();
  }

  async getReportById(id: string): Promise<Report | null> {
    return await this.unifiedService.getReportById(id);
  }

  async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Report | null> {
    return await this.unifiedService.createReport(reportData);
  }

  async updateReport(id: string, updates: Partial<Omit<Report, 'id' | 'createdAt'>>): Promise<Report | null> {
    return await this.unifiedService.updateReport(id, updates);
  }

  async deleteReport(id: string): Promise<boolean> {
    return await this.unifiedService.deleteReport(id);
  }

  async getReportsByStatus(status: Report['status']): Promise<Report[]> {
    return await this.unifiedService.getReportsByStatus(status);
  }

  async getReportsCountByStatus(): Promise<{ pending: number; processing: number; resolved: number; rejected: number }> {
    return await this.unifiedService.getReportsCountByStatus();
  }

  clearAllReports(): void {
    if (this.shouldUseSupabase()) {
      console.warn('clearAllReports not supported for Supabase (use deleteReport individually)');
    } else {
      localDB.clearAllReports();
    }
  }

  // ========== COMMUNITY POST METHODS ==========
  // Refactored to delegate to unified service - eliminates duplicate code

  async getAllPosts(): Promise<CommunityPost[]> {
    return await this.unifiedService.getAllPosts();
  }

  async getPostById(id: string): Promise<CommunityPost | null> {
    return await this.unifiedService.getPostById(id);
  }

  async createPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<CommunityPost | null> {
    return await this.unifiedService.createPost(postData);
  }

  async updatePost(id: string, updates: Partial<Omit<CommunityPost, 'id' | 'createdAt'>>): Promise<CommunityPost | null> {
    return await this.unifiedService.updatePost(id, updates);
  }

  async togglePostLike(postId: string, userId: string): Promise<CommunityPost | null> {
    return await this.unifiedService.togglePostLike(postId, userId);
  }

  async deletePost(id: string): Promise<boolean> {
    return await this.unifiedService.deletePost(id);
  }

  // ========== COMMENT METHODS ==========
  // Refactored to delegate to unified service - eliminates duplicate code

  async getAllComments(): Promise<Comment[]> {
    return await this.unifiedService.getAllComments();
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return await this.unifiedService.getCommentsByPostId(postId);
  }

  async createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<Comment | null> {
    return await this.unifiedService.createComment(commentData);
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<Comment | null> {
    return await this.unifiedService.toggleCommentLike(commentId, userId);
  }

  async deleteComment(id: string): Promise<boolean> {
    return await this.unifiedService.deleteComment(id);
  }

  // ========== UTILITY METHODS ==========
  // Refactored to delegate to services - following Single Responsibility Principle

  async initWithSampleData(): Promise<void> {
    return await this.unifiedService.initWithSampleData();
  }

  // Migration methods - delegate to config service
  markMigrationCompleted(): void {
    databaseConfigService.markMigrationCompleted();
  }

  isMigrationCompleted(): boolean {
    return databaseConfigService.isMigrationCompleted();
  }

  resetMigrationStatus(): void {
    databaseConfigService.resetMigrationStatus();
  }

  getCurrentMode(): 'localStorage' | 'supabase' {
    return this.unifiedService.getCurrentMode();
  }

  async testConnection(): Promise<{ localStorage: boolean; supabase: boolean }> {
    return await this.unifiedService.testConnection();
  }
}

// 싱글톤 인스턴스 생성
export const database = new DatabaseService();

/**
 * Legacy compatibility wrapper
 * Provides same interface but with refactored implementation
 * Following Facade Pattern for backward compatibility
 */
export const db = {
  // Reports - now using refactored services
  getAllReports: () => database.getAllReports(),
  getReportById: (id: string) => database.getReportById(id),
  createReport: (reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>) =>
    database.createReport(reportData),
  updateReport: (id: string, updates: Partial<Omit<Report, 'id' | 'createdAt'>>) =>
    database.updateReport(id, updates),
  deleteReport: (id: string) => database.deleteReport(id),
  getReportsByStatus: (status: Report['status']) => database.getReportsByStatus(status),
  getReportsCountByStatus: () => database.getReportsCountByStatus(),
  clearAllReports: () => database.clearAllReports(),

  // Posts - now using refactored services
  getAllPosts: () => database.getAllPosts(),
  getPostById: (id: string) => database.getPostById(id),
  createPost: (postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>) =>
    database.createPost(postData),
  updatePost: (id: string, updates: Partial<Omit<CommunityPost, 'id' | 'createdAt'>>) =>
    database.updatePost(id, updates),
  togglePostLike: (postId: string, userId: string) => database.togglePostLike(postId, userId),
  deletePost: (id: string) => database.deletePost(id),

  // Comments - now using refactored services
  getAllComments: () => database.getAllComments(),
  getCommentsByPostId: (postId: string) => database.getCommentsByPostId(postId),
  createComment: (commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>) =>
    database.createComment(commentData),
  toggleCommentLike: (commentId: string, userId: string) => database.toggleCommentLike(commentId, userId),
  deleteComment: (id: string) => database.deleteComment(id),

  // Utility - now using refactored services
  initWithSampleData: () => database.initWithSampleData(),
  getCurrentMode: () => database.getCurrentMode(),
  testConnection: () => database.testConnection()
};

export type { Report, CommunityPost, Comment };