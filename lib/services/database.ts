// Unified Database Service
// localStorage와 Supabase를 선택적으로 사용할 수 있는 통합 데이터베이스 서비스

import { localDB, Report, CommunityPost, Comment } from './localDB';
import { supabaseDB } from './supabaseDB';
import { useAuth } from '@/lib/hooks/useAuth';

export type DatabaseMode = 'localStorage' | 'supabase' | 'auto';

class DatabaseService {
  private mode: DatabaseMode = 'auto';
  private forceLocalStorage = false;

  // 데이터베이스 모드 설정
  setMode(mode: DatabaseMode) {
    this.mode = mode;
  }

  // 강제로 localStorage 사용 (마이그레이션 전 백업용)
  setForceLocalStorage(force: boolean) {
    this.forceLocalStorage = force;
  }

  // 현재 사용할 데이터베이스 결정
  private shouldUseSupabase(): boolean {
    if (this.forceLocalStorage) return false;
    if (this.mode === 'localStorage') return false;
    if (this.mode === 'supabase') return true;

    // auto 모드: Supabase 사용 가능 여부 확인
    if (typeof window !== 'undefined') {
      // 클라이언트 사이드에서만 localStorage 확인
      const migrationCompleted = localStorage.getItem('migration_completed');
      return migrationCompleted === 'true';
    }

    return true; // 서버 사이드에서는 기본적으로 Supabase 사용
  }

  // 사용자 정보 가져오기 (훅 없이)
  private getCurrentUser(): { userId?: string; associationId?: string } {
    if (typeof window === 'undefined') return {};

    try {
      // 클라이언트에서 현재 사용자 정보 가져오기
      const authData = localStorage.getItem('kyokwon119-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        return {
          userId: parsed.state?.user?.id,
          associationId: undefined // 추후 협회 정보 추가
        };
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }

    return {};
  }

  // ========== REPORT METHODS ==========

  async getAllReports(): Promise<Report[]> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.getAllReports();
    } else {
      return localDB.getAllReports();
    }
  }

  async getReportById(id: string): Promise<Report | null> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.getReportById(id);
    } else {
      return localDB.getReportById(id);
    }
  }

  async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Report | null> {
    if (this.shouldUseSupabase()) {
      const { userId, associationId } = this.getCurrentUser();
      if (!userId) {
        console.error('User ID required for Supabase report creation');
        return null;
      }
      return await supabaseDB.createReport(reportData, userId, associationId);
    } else {
      return localDB.createReport(reportData);
    }
  }

  async updateReport(id: string, updates: Partial<Omit<Report, 'id' | 'createdAt'>>): Promise<Report | null> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.updateReport(id, updates);
    } else {
      return localDB.updateReport(id, updates);
    }
  }

  async deleteReport(id: string): Promise<boolean> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.deleteReport(id);
    } else {
      return localDB.deleteReport(id);
    }
  }

  async getReportsByStatus(status: Report['status']): Promise<Report[]> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.getReportsByStatus(status);
    } else {
      return localDB.getReportsByStatus(status);
    }
  }

  async getReportsCountByStatus(): Promise<{ pending: number; processing: number; resolved: number; rejected: number }> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.getReportsCountByStatus();
    } else {
      return localDB.getReportsCountByStatus();
    }
  }

  clearAllReports(): void {
    if (this.shouldUseSupabase()) {
      console.warn('clearAllReports not supported for Supabase (use deleteReport individually)');
    } else {
      localDB.clearAllReports();
    }
  }

  // ========== COMMUNITY POST METHODS ==========

  async getAllPosts(): Promise<CommunityPost[]> {
    if (this.shouldUseSupabase()) {
      const { associationId } = this.getCurrentUser();
      return await supabaseDB.getAllPosts(associationId);
    } else {
      return localDB.getAllPosts();
    }
  }

  async getPostById(id: string): Promise<CommunityPost | null> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.getPostById(id);
    } else {
      return localDB.getPostById(id);
    }
  }

  async createPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<CommunityPost | null> {
    if (this.shouldUseSupabase()) {
      const { userId, associationId } = this.getCurrentUser();
      if (!userId) {
        console.error('User ID required for Supabase post creation');
        return null;
      }
      return await supabaseDB.createPost(postData, userId, associationId);
    } else {
      return localDB.createPost(postData);
    }
  }

  async updatePost(id: string, updates: Partial<Omit<CommunityPost, 'id' | 'createdAt'>>): Promise<CommunityPost | null> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.updatePost(id, updates);
    } else {
      return localDB.updatePost(id, updates);
    }
  }

  async togglePostLike(postId: string, userId: string): Promise<CommunityPost | null> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.togglePostLike(postId, userId);
    } else {
      return localDB.togglePostLike(postId, userId);
    }
  }

  async deletePost(id: string): Promise<boolean> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.deletePost(id);
    } else {
      return localDB.deletePost(id);
    }
  }

  // ========== COMMENT METHODS ==========

  async getAllComments(): Promise<Comment[]> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.getAllComments();
    } else {
      return localDB.getAllComments();
    }
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.getCommentsByPostId(postId);
    } else {
      return localDB.getCommentsByPostId(postId);
    }
  }

  async createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<Comment | null> {
    if (this.shouldUseSupabase()) {
      const { userId } = this.getCurrentUser();
      if (!userId) {
        console.error('User ID required for Supabase comment creation');
        return null;
      }
      return await supabaseDB.createComment(commentData, userId);
    } else {
      return localDB.createComment(commentData);
    }
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<Comment | null> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.toggleCommentLike(commentId, userId);
    } else {
      return localDB.toggleCommentLike(commentId, userId);
    }
  }

  async deleteComment(id: string): Promise<boolean> {
    if (this.shouldUseSupabase()) {
      return await supabaseDB.deleteComment(id);
    } else {
      return localDB.deleteComment(id);
    }
  }

  // ========== UTILITY METHODS ==========

  async initWithSampleData(): Promise<void> {
    if (this.shouldUseSupabase()) {
      const { userId, associationId } = this.getCurrentUser();
      if (userId) {
        await supabaseDB.initWithSampleData(userId, associationId);
      }
    } else {
      localDB.initWithSampleData();
    }
  }

  // 마이그레이션 완료 표시
  markMigrationCompleted(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('migration_completed', 'true');
    }
  }

  // 마이그레이션 상태 확인
  isMigrationCompleted(): boolean {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('migration_completed') === 'true';
    }
    return false;
  }

  // 마이그레이션 상태 초기화 (개발/테스트용)
  resetMigrationStatus(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('migration_completed');
    }
  }

  // 현재 데이터베이스 모드 확인
  getCurrentMode(): 'localStorage' | 'supabase' {
    return this.shouldUseSupabase() ? 'supabase' : 'localStorage';
  }

  // 데이터베이스 연결 상태 확인
  async testConnection(): Promise<{ localStorage: boolean; supabase: boolean }> {
    const result = { localStorage: false, supabase: false };

    try {
      // localStorage 테스트
      const testData = localDB.getAllReports();
      result.localStorage = true;
    } catch (error) {
      console.error('localStorage test failed:', error);
    }

    try {
      // Supabase 테스트
      await supabaseDB.getAllReports();
      result.supabase = true;
    } catch (error) {
      console.error('Supabase test failed:', error);
    }

    return result;
  }
}

// 싱글톤 인스턴스 생성
export const database = new DatabaseService();

// 기존 localDB와의 호환성을 위한 래퍼
export const db = {
  // Reports
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

  // Posts
  getAllPosts: () => database.getAllPosts(),
  getPostById: (id: string) => database.getPostById(id),
  createPost: (postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>) =>
    database.createPost(postData),
  updatePost: (id: string, updates: Partial<Omit<CommunityPost, 'id' | 'createdAt'>>) =>
    database.updatePost(id, updates),
  togglePostLike: (postId: string, userId: string) => database.togglePostLike(postId, userId),
  deletePost: (id: string) => database.deletePost(id),

  // Comments
  getAllComments: () => database.getAllComments(),
  getCommentsByPostId: (postId: string) => database.getCommentsByPostId(postId),
  createComment: (commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>) =>
    database.createComment(commentData),
  toggleCommentLike: (commentId: string, userId: string) => database.toggleCommentLike(commentId, userId),
  deleteComment: (id: string) => database.deleteComment(id),

  // Utility
  initWithSampleData: () => database.initWithSampleData(),
  getCurrentMode: () => database.getCurrentMode(),
  testConnection: () => database.testConnection()
};

export type { Report, CommunityPost, Comment };