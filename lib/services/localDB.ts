/**
 * Refactored Local Database Service
 * Following SOLID principles and composition over inheritance
 */

import { LocalReportRepository } from '@/lib/db/repositories/report-repository';
import { LocalCommunityPostRepository } from '@/lib/db/repositories/community-post-repository';
import { LocalCommentRepository } from '@/lib/db/repositories/comment-repository';
import { Report, CommunityPost, Comment, IReportRepository, ICommunityPostRepository, ICommentRepository } from '@/lib/db/interfaces';
import { ReportStatusType } from '@/lib/db/constants';

// Re-export interfaces for backward compatibility
export type { Report, CommunityPost, Comment };

/**
 * Refactored LocalDB Class using Composition Pattern
 * Following Single Responsibility and Dependency Inversion Principles
 */
class LocalDB {
  private reportRepository: IReportRepository;
  private postRepository: ICommunityPostRepository;
  private commentRepository: ICommentRepository;

  constructor() {
    // Dependency injection - following Dependency Inversion Principle
    this.reportRepository = new LocalReportRepository();
    this.postRepository = new LocalCommunityPostRepository();
    this.commentRepository = new LocalCommentRepository();
  }

  // ========== REPORT METHODS - Delegate to Repository ==========

  getAllReports(): Promise<Report[]> {
    return this.reportRepository.getAllReports();
  }

  getReportById(id: string): Promise<Report | null> {
    return this.reportRepository.getReportById(id);
  }

  createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Report | null> {
    return this.reportRepository.createReport(reportData);
  }

  updateReport(id: string, updates: Partial<Omit<Report, 'id' | 'createdAt'>>): Promise<Report | null> {
    return this.reportRepository.updateReport(id, updates);
  }

  deleteReport(id: string): Promise<boolean> {
    return this.reportRepository.deleteReport(id);
  }

  getReportsByStatus(status: ReportStatusType): Promise<Report[]> {
    return this.reportRepository.getReportsByStatus(status);
  }

  getReportsCountByStatus(): Promise<{ pending: number; processing: number; resolved: number; rejected: number }> {
    return this.reportRepository.getReportsCountByStatus();
  }

  clearAllReports(): void {
    // Cast to access implementation-specific method
    (this.reportRepository as LocalReportRepository).clearAllReports();
  }

  // ========== COMMUNITY POST METHODS - Delegate to Repository ==========

  getAllPosts(): Promise<CommunityPost[]> {
    return this.postRepository.getAllPosts();
  }

  getPostById(id: string): Promise<CommunityPost | null> {
    return this.postRepository.getPostById(id);
  }

  createPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<CommunityPost | null> {
    return this.postRepository.createPost(postData);
  }

  updatePost(id: string, updates: Partial<Omit<CommunityPost, 'id' | 'createdAt'>>): Promise<CommunityPost | null> {
    return this.postRepository.updatePost(id, updates);
  }

  togglePostLike(postId: string, userId: string): Promise<CommunityPost | null> {
    return this.postRepository.togglePostLike(postId, userId);
  }

  async deletePost(id: string): Promise<boolean> {
    // Delete associated comments first
    await (this.commentRepository as LocalCommentRepository).deleteCommentsByPostId(id);
    return this.postRepository.deletePost(id);
  }

  // ========== COMMENT METHODS - Delegate to Repository ==========

  getAllComments(): Promise<Comment[]> {
    return this.commentRepository.getAllComments();
  }

  getCommentsByPostId(postId: string): Promise<Comment[]> {
    return this.commentRepository.getCommentsByPostId(postId);
  }

  createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<Comment | null> {
    return this.commentRepository.createComment(commentData);
  }

  toggleCommentLike(commentId: string, userId: string): Promise<Comment | null> {
    return this.commentRepository.toggleCommentLike(commentId, userId);
  }

  deleteComment(id: string): Promise<boolean> {
    return this.commentRepository.deleteComment(id);
  }

  // ========== UTILITY METHODS - Delegate to Repositories ==========

  /**
   * Initialize with sample data (for development/demo)
   * Following Single Responsibility - delegates to repositories
   */
  async initWithSampleData(): Promise<void> {
    // Initialize repositories with sample data
    await (this.reportRepository as LocalReportRepository).initWithSampleData();
    await (this.postRepository as LocalCommunityPostRepository).initWithSampleData();

    // Initialize comments with sample data after posts exist
    const posts = await this.getAllPosts();
    await (this.commentRepository as LocalCommentRepository).initWithSampleData(posts);
  }

  /**
   * Get access to individual repositories (for advanced usage)
   */
  getRepositories() {
    return {
      reports: this.reportRepository,
      posts: this.postRepository,
      comments: this.commentRepository
    };
  }
}

export const localDB = new LocalDB();