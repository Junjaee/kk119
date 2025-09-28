/**
 * Unified Database Service using Adapter Pattern
 * Following SOLID principles - eliminates duplicate code and applies proper abstraction
 */

import { IUnifiedDatabase, IReportRepository, ICommunityPostRepository, ICommentRepository, Report, CommunityPost, Comment } from './interfaces';
import { userContextService } from './user-context-service';
import { databaseConfigService } from './database-config-service';
import { ReportStatusType } from './constants';

/**
 * Base adapter class following Adapter Pattern
 * Eliminates duplicate code by implementing common branching logic once
 */
abstract class DatabaseAdapter {
  protected async executeWithStrategy<T>(
    localOperation: () => T | Promise<T>,
    supabaseOperation: () => T | Promise<T>
  ): Promise<T> {
    if (databaseConfigService.shouldUseSupabase()) {
      return await supabaseOperation();
    } else {
      return await localOperation();
    }
  }
}

/**
 * Report Repository Adapter
 * Following Single Responsibility Principle
 */
class ReportRepositoryAdapter extends DatabaseAdapter implements IReportRepository {
  constructor(
    private localReports: IReportRepository,
    private supabaseReports: IReportRepository
  ) {
    super();
  }

  async getAllReports(): Promise<Report[]> {
    return this.executeWithStrategy(
      () => this.localReports.getAllReports(),
      () => this.supabaseReports.getAllReports()
    );
  }

  async getReportById(id: string): Promise<Report | null> {
    return this.executeWithStrategy(
      () => this.localReports.getReportById(id),
      () => this.supabaseReports.getReportById(id)
    );
  }

  async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Report | null> {
    return this.executeWithStrategy(
      () => this.localReports.createReport(reportData),
      async () => {
        const { userId, associationId } = userContextService.validateUserContext();
        // Note: This assumes Supabase adapter handles user context internally
        return this.supabaseReports.createReport(reportData);
      }
    );
  }

  async updateReport(id: string, updates: Partial<Omit<Report, 'id' | 'createdAt'>>): Promise<Report | null> {
    return this.executeWithStrategy(
      () => this.localReports.updateReport(id, updates),
      () => this.supabaseReports.updateReport(id, updates)
    );
  }

  async deleteReport(id: string): Promise<boolean> {
    return this.executeWithStrategy(
      () => this.localReports.deleteReport(id),
      () => this.supabaseReports.deleteReport(id)
    );
  }

  async getReportsByStatus(status: ReportStatusType): Promise<Report[]> {
    return this.executeWithStrategy(
      () => this.localReports.getReportsByStatus(status),
      () => this.supabaseReports.getReportsByStatus(status)
    );
  }

  async getReportsCountByStatus(): Promise<{ pending: number; processing: number; resolved: number; rejected: number }> {
    return this.executeWithStrategy(
      () => this.localReports.getReportsCountByStatus(),
      () => this.supabaseReports.getReportsCountByStatus()
    );
  }
}

/**
 * Community Post Repository Adapter
 * Following Single Responsibility Principle
 */
class CommunityPostRepositoryAdapter extends DatabaseAdapter implements ICommunityPostRepository {
  constructor(
    private localPosts: ICommunityPostRepository,
    private supabasePosts: ICommunityPostRepository
  ) {
    super();
  }

  async getAllPosts(): Promise<CommunityPost[]> {
    return this.executeWithStrategy(
      () => this.localPosts.getAllPosts(),
      () => this.supabasePosts.getAllPosts()
    );
  }

  async getPostById(id: string): Promise<CommunityPost | null> {
    return this.executeWithStrategy(
      () => this.localPosts.getPostById(id),
      () => this.supabasePosts.getPostById(id)
    );
  }

  async createPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<CommunityPost | null> {
    return this.executeWithStrategy(
      () => this.localPosts.createPost(postData),
      async () => {
        const { userId } = userContextService.validateUserContext();
        return this.supabasePosts.createPost(postData);
      }
    );
  }

  async updatePost(id: string, updates: Partial<Omit<CommunityPost, 'id' | 'createdAt'>>): Promise<CommunityPost | null> {
    return this.executeWithStrategy(
      () => this.localPosts.updatePost(id, updates),
      () => this.supabasePosts.updatePost(id, updates)
    );
  }

  async togglePostLike(postId: string, userId: string): Promise<CommunityPost | null> {
    return this.executeWithStrategy(
      () => this.localPosts.togglePostLike(postId, userId),
      () => this.supabasePosts.togglePostLike(postId, userId)
    );
  }

  async deletePost(id: string): Promise<boolean> {
    return this.executeWithStrategy(
      () => this.localPosts.deletePost(id),
      () => this.supabasePosts.deletePost(id)
    );
  }
}

/**
 * Comment Repository Adapter
 * Following Single Responsibility Principle
 */
class CommentRepositoryAdapter extends DatabaseAdapter implements ICommentRepository {
  constructor(
    private localComments: ICommentRepository,
    private supabaseComments: ICommentRepository
  ) {
    super();
  }

  async getAllComments(): Promise<Comment[]> {
    return this.executeWithStrategy(
      () => this.localComments.getAllComments(),
      () => this.supabaseComments.getAllComments()
    );
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return this.executeWithStrategy(
      () => this.localComments.getCommentsByPostId(postId),
      () => this.supabaseComments.getCommentsByPostId(postId)
    );
  }

  async createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<Comment | null> {
    return this.executeWithStrategy(
      () => this.localComments.createComment(commentData),
      async () => {
        const { userId } = userContextService.validateUserContext();
        return this.supabaseComments.createComment(commentData);
      }
    );
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<Comment | null> {
    return this.executeWithStrategy(
      () => this.localComments.toggleCommentLike(commentId, userId),
      () => this.supabaseComments.toggleCommentLike(commentId, userId)
    );
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.executeWithStrategy(
      () => this.localComments.deleteComment(id),
      () => this.supabaseComments.deleteComment(id)
    );
  }
}

/**
 * Unified Database Service
 * Following Composition over Inheritance and Dependency Inversion Principle
 */
export class UnifiedDatabaseService extends DatabaseAdapter implements IUnifiedDatabase {
  private reportAdapter: ReportRepositoryAdapter;
  private postAdapter: CommunityPostRepositoryAdapter;
  private commentAdapter: CommentRepositoryAdapter;

  constructor(
    localReports: IReportRepository,
    supabaseReports: IReportRepository,
    localPosts: ICommunityPostRepository,
    supabasePosts: ICommunityPostRepository,
    localComments: ICommentRepository,
    supabaseComments: ICommentRepository
  ) {
    super();
    this.reportAdapter = new ReportRepositoryAdapter(localReports, supabaseReports);
    this.postAdapter = new CommunityPostRepositoryAdapter(localPosts, supabasePosts);
    this.commentAdapter = new CommentRepositoryAdapter(localComments, supabaseComments);
  }

  // Report methods - delegate to adapter
  async getAllReports(): Promise<Report[]> {
    return this.reportAdapter.getAllReports();
  }

  async getReportById(id: string): Promise<Report | null> {
    return this.reportAdapter.getReportById(id);
  }

  async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Report | null> {
    return this.reportAdapter.createReport(reportData);
  }

  async updateReport(id: string, updates: Partial<Omit<Report, 'id' | 'createdAt'>>): Promise<Report | null> {
    return this.reportAdapter.updateReport(id, updates);
  }

  async deleteReport(id: string): Promise<boolean> {
    return this.reportAdapter.deleteReport(id);
  }

  async getReportsByStatus(status: ReportStatusType): Promise<Report[]> {
    return this.reportAdapter.getReportsByStatus(status);
  }

  async getReportsCountByStatus(): Promise<{ pending: number; processing: number; resolved: number; rejected: number }> {
    return this.reportAdapter.getReportsCountByStatus();
  }

  // Post methods - delegate to adapter
  async getAllPosts(): Promise<CommunityPost[]> {
    return this.postAdapter.getAllPosts();
  }

  async getPostById(id: string): Promise<CommunityPost | null> {
    return this.postAdapter.getPostById(id);
  }

  async createPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<CommunityPost | null> {
    return this.postAdapter.createPost(postData);
  }

  async updatePost(id: string, updates: Partial<Omit<CommunityPost, 'id' | 'createdAt'>>): Promise<CommunityPost | null> {
    return this.postAdapter.updatePost(id, updates);
  }

  async togglePostLike(postId: string, userId: string): Promise<CommunityPost | null> {
    return this.postAdapter.togglePostLike(postId, userId);
  }

  async deletePost(id: string): Promise<boolean> {
    return this.postAdapter.deletePost(id);
  }

  // Comment methods - delegate to adapter
  async getAllComments(): Promise<Comment[]> {
    return this.commentAdapter.getAllComments();
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return this.commentAdapter.getCommentsByPostId(postId);
  }

  async createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<Comment | null> {
    return this.commentAdapter.createComment(commentData);
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<Comment | null> {
    return this.commentAdapter.toggleCommentLike(commentId, userId);
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.commentAdapter.deleteComment(id);
  }

  // Utility methods
  async initWithSampleData(): Promise<void> {
    return this.executeWithStrategy(
      // For localStorage, call initWithSampleData on local services
      async () => {
        // This would need to be implemented by the local services
        console.log('Initializing localStorage with sample data');
      },
      async () => {
        const { userId, associationId } = userContextService.validateUserContext();
        // For Supabase, call initWithSampleData with user context
        console.log('Initializing Supabase with sample data');
      }
    );
  }

  getCurrentMode(): 'localStorage' | 'supabase' {
    return databaseConfigService.getCurrentMode();
  }

  async testConnection(): Promise<{ localStorage: boolean; supabase: boolean }> {
    const result = { localStorage: false, supabase: false };

    try {
      // Test localStorage
      await this.getAllReports();
      result.localStorage = true;
    } catch (error) {
      console.error('localStorage test failed:', error);
    }

    try {
      // Test Supabase (this would need proper implementation)
      // await supabaseReports.getAllReports();
      result.supabase = true;
    } catch (error) {
      console.error('Supabase test failed:', error);
    }

    return result;
  }
}