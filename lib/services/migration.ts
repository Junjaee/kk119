// Data Migration Service - localStorage to Supabase
// 기존 localStorage 데이터를 Supabase로 이전하는 서비스

import { createClient } from '@/lib/supabase/client';
import { localDB, Report, CommunityPost, Comment } from './localDB';

export interface MigrationResult {
  success: boolean;
  message: string;
  details: {
    reports: { migrated: number; errors: number };
    posts: { migrated: number; errors: number };
    comments: { migrated: number; errors: number };
  };
}

export class DataMigrationService {
  private supabase = createClient();

  // 메인 마이그레이션 함수
  async migrateAllData(userId: string, associationId?: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      message: '',
      details: {
        reports: { migrated: 0, errors: 0 },
        posts: { migrated: 0, errors: 0 },
        comments: { migrated: 0, errors: 0 }
      }
    };

    try {
      // 1. 신고 데이터 마이그레이션
      console.log('Migrating reports...');
      const reportsResult = await this.migrateReports(userId, associationId);
      result.details.reports = reportsResult;

      // 2. 커뮤니티 포스트 마이그레이션
      console.log('Migrating community posts...');
      const postsResult = await this.migratePosts(userId, associationId);
      result.details.posts = postsResult;

      // 3. 댓글 마이그레이션
      console.log('Migrating comments...');
      const commentsResult = await this.migrateComments(userId);
      result.details.comments = commentsResult;

      const totalMigrated =
        result.details.reports.migrated +
        result.details.posts.migrated +
        result.details.comments.migrated;

      const totalErrors =
        result.details.reports.errors +
        result.details.posts.errors +
        result.details.comments.errors;

      result.success = totalErrors === 0;
      result.message = `마이그레이션 완료: ${totalMigrated}개 항목 이전, ${totalErrors}개 오류`;

      // 마이그레이션 성공 시 localStorage 백업 및 클리어
      if (result.success && totalMigrated > 0) {
        await this.backupAndClearLocalStorage();
      }

      return result;
    } catch (error) {
      console.error('Migration failed:', error);
      result.success = false;
      result.message = `마이그레이션 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
      return result;
    }
  }

  // 신고 데이터 마이그레이션
  private async migrateReports(userId: string, associationId?: string): Promise<{ migrated: number; errors: number }> {
    const reports = localDB.getAllReports();
    let migrated = 0;
    let errors = 0;

    for (const report of reports) {
      try {
        const { error } = await this.supabase
          .from('incident_reports')
          .insert({
            reporter_id: userId,
            association_id: associationId,
            title: report.title,
            content: report.content,
            incident_date: report.incident_date,
            incident_location: report.location,
            witnesses: report.witnesses,
            evidence_files: report.fileNames ? { files: report.fileNames } : null,
            status: this.mapReportStatus(report.status),
            urgency_level: 1, // 기본값
            created_at: report.createdAt,
            updated_at: report.updatedAt
          });

        if (error) {
          console.error(`Report migration error for ${report.id}:`, error);
          errors++;
        } else {
          migrated++;
        }
      } catch (error) {
        console.error(`Report migration exception for ${report.id}:`, error);
        errors++;
      }
    }

    return { migrated, errors };
  }

  // 커뮤니티 포스트 마이그레이션
  private async migratePosts(userId: string, associationId?: string): Promise<{ migrated: number; errors: number }> {
    const posts = localDB.getAllPosts();
    let migrated = 0;
    let errors = 0;

    for (const post of posts) {
      try {
        const { error } = await this.supabase
          .from('community_posts')
          .insert({
            author_id: userId,
            association_id: associationId,
            title: post.title,
            content: post.content,
            category: this.mapPostCategory(post.category),
            is_anonymous: false,
            view_count: 0,
            like_count: post.likes,
            liked_by: post.likedBy || [],
            created_at: post.createdAt,
            updated_at: post.updatedAt
          });

        if (error) {
          console.error(`Post migration error for ${post.id}:`, error);
          errors++;
        } else {
          migrated++;
        }
      } catch (error) {
        console.error(`Post migration exception for ${post.id}:`, error);
        errors++;
      }
    }

    return { migrated, errors };
  }

  // 댓글 마이그레이션
  private async migrateComments(userId: string): Promise<{ migrated: number; errors: number }> {
    const comments = localDB.getAllComments();
    let migrated = 0;
    let errors = 0;

    // 먼저 Supabase의 포스트 ID 매핑을 가져와야 함
    const { data: supabasePosts } = await this.supabase
      .from('community_posts')
      .select('id, title, created_at')
      .eq('author_id', userId);

    if (!supabasePosts || supabasePosts.length === 0) {
      console.log('No posts found in Supabase to migrate comments to');
      return { migrated: 0, errors: 0 };
    }

    // localStorage 포스트와 Supabase 포스트 매핑 (제목과 생성일로 매칭)
    const postMapping = new Map<string, string>();
    const localPosts = localDB.getAllPosts();

    for (const localPost of localPosts) {
      const matchingSupabasePost = supabasePosts.find(sp =>
        sp.title === localPost.title &&
        new Date(sp.created_at).getTime() === new Date(localPost.createdAt).getTime()
      );

      if (matchingSupabasePost) {
        postMapping.set(localPost.id, matchingSupabasePost.id);
      }
    }

    for (const comment of comments) {
      try {
        const supabasePostId = postMapping.get(comment.postId);

        if (!supabasePostId) {
          console.warn(`No matching Supabase post found for comment ${comment.id}`);
          errors++;
          continue;
        }

        const { error } = await this.supabase
          .from('community_comments')
          .insert({
            post_id: supabasePostId,
            author_id: userId,
            content: comment.content,
            is_anonymous: false,
            like_count: comment.likes,
            liked_by: comment.likedBy || [],
            created_at: comment.createdAt,
            updated_at: comment.updatedAt
          });

        if (error) {
          console.error(`Comment migration error for ${comment.id}:`, error);
          errors++;
        } else {
          migrated++;
        }
      } catch (error) {
        console.error(`Comment migration exception for ${comment.id}:`, error);
        errors++;
      }
    }

    return { migrated, errors };
  }

  // 상태 매핑 함수들
  private mapReportStatus(localStatus: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'submitted',
      'processing': 'investigating',
      'resolved': 'resolved',
      'rejected': 'closed'
    };
    return statusMap[localStatus] || 'submitted';
  }

  private mapPostCategory(localCategory: string): string {
    const categoryMap: Record<string, string> = {
      'general': 'general',
      'experience': 'experience',
      'advice': 'advice',
      'legal': 'legal',
      'support': 'support'
    };
    return categoryMap[localCategory] || 'general';
  }

  // localStorage 백업 및 클리어
  private async backupAndClearLocalStorage(): Promise<void> {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        reports: localDB.getAllReports(),
        posts: localDB.getAllPosts(),
        comments: localDB.getAllComments()
      };

      // 백업을 sessionStorage에 임시 저장 (복구 가능하도록)
      sessionStorage.setItem('localStorage_backup', JSON.stringify(backup));

      // localStorage 클리어
      localDB.clearAllReports();
      localStorage.removeItem('kk119_community_posts');
      localStorage.removeItem('kk119_community_comments');

      console.log('localStorage cleared, backup stored in sessionStorage');
    } catch (error) {
      console.error('Failed to backup localStorage:', error);
    }
  }

  // 백업 복구 함수 (오류 발생 시 사용)
  async restoreFromBackup(): Promise<boolean> {
    try {
      const backupData = sessionStorage.getItem('localStorage_backup');
      if (!backupData) {
        console.error('No backup found');
        return false;
      }

      const backup = JSON.parse(backupData);

      // 백업 데이터를 localStorage로 복구
      localStorage.setItem('kk119_reports', JSON.stringify(backup.reports));
      localStorage.setItem('kk119_community_posts', JSON.stringify(backup.posts));
      localStorage.setItem('kk119_community_comments', JSON.stringify(backup.comments));

      console.log('Data restored from backup');
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  // 마이그레이션 가능 여부 체크
  async checkMigrationReadiness(userId: string): Promise<{
    canMigrate: boolean;
    reason?: string;
    localDataCount: { reports: number; posts: number; comments: number };
  }> {
    const localDataCount = {
      reports: localDB.getAllReports().length,
      posts: localDB.getAllPosts().length,
      comments: localDB.getAllComments().length
    };

    // 로컬 데이터가 없으면 마이그레이션 불필요
    if (localDataCount.reports === 0 && localDataCount.posts === 0 && localDataCount.comments === 0) {
      return {
        canMigrate: false,
        reason: '마이그레이션할 로컬 데이터가 없습니다.',
        localDataCount
      };
    }

    // 사용자 프로필 확인
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('id, role, is_verified')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return {
        canMigrate: false,
        reason: '사용자 프로필을 찾을 수 없습니다.',
        localDataCount
      };
    }

    if (!profile.is_verified) {
      return {
        canMigrate: false,
        reason: '계정이 아직 승인되지 않았습니다.',
        localDataCount
      };
    }

    return {
      canMigrate: true,
      localDataCount
    };
  }
}

export const migrationService = new DataMigrationService();