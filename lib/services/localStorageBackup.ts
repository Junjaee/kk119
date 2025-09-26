// LocalStorage 백업 및 마이그레이션 시스템
// 기존 LocalStorage 데이터를 백업하고 Supabase로 마이그레이션하기 위한 유틸리티

import { localDB, Report, CommunityPost, Comment } from './localDB';

export interface BackupData {
  timestamp: string;
  version: string;
  reports: Report[];
  communityPosts: CommunityPost[];
  comments: Comment[];
  metadata: {
    totalReports: number;
    totalPosts: number;
    totalComments: number;
    backupSource: 'localStorage';
    backupType: 'full' | 'incremental';
  };
}

// Supabase 스키마에 맞는 데이터 구조 (마이그레이션용)
export interface SupabaseReportData {
  title: string;
  content: string;
  incident_date: string;
  incident_location: string;
  witnesses: string;
  evidence_files: any;
  status: 'submitted' | 'investigating' | 'consulting' | 'resolved' | 'closed';
  urgency_level: number;
  reporter_id: string;
  association_id: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseCommunityPostData {
  title: string;
  content: string;
  category: 'general' | 'experience' | 'advice' | 'legal' | 'support';
  author_id: string;
  association_id: string;
  is_anonymous: boolean;
  view_count: number;
  like_count: number;
  liked_by: string[];
  created_at: string;
  updated_at: string;
}

export interface SupabaseCommentData {
  post_id: string;
  content: string;
  author_id: string;
  is_anonymous: boolean;
  like_count: number;
  liked_by: string[];
  created_at: string;
  updated_at: string;
}

class LocalStorageBackupService {
  private readonly BACKUP_KEY = 'kk119_backup_data';
  private readonly VERSION = '1.0.0';

  /**
   * 전체 localStorage 데이터 백업 생성
   */
  createFullBackup(): BackupData {
    try {
      const reports = localDB.getAllReports();
      const communityPosts = localDB.getAllPosts();
      const comments = localDB.getAllComments();

      const backupData: BackupData = {
        timestamp: new Date().toISOString(),
        version: this.VERSION,
        reports,
        communityPosts,
        comments,
        metadata: {
          totalReports: reports.length,
          totalPosts: communityPosts.length,
          totalComments: comments.length,
          backupSource: 'localStorage',
          backupType: 'full'
        }
      };

      // 백업 데이터를 localStorage에도 저장
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backupData));

      console.log('Full backup created successfully:', {
        reports: reports.length,
        posts: communityPosts.length,
        comments: comments.length
      });

      return backupData;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  /**
   * 백업 데이터를 JSON 파일로 다운로드
   */
  downloadBackupAsJSON(): void {
    try {
      const backupData = this.createFullBackup();
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `kk119_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Backup downloaded successfully');
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw new Error('Failed to download backup');
    }
  }

  /**
   * 저장된 백업 데이터 불러오기
   */
  getStoredBackup(): BackupData | null {
    try {
      const data = localStorage.getItem(this.BACKUP_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading stored backup:', error);
      return null;
    }
  }

  /**
   * LocalStorage 데이터를 Supabase 스키마 형식으로 변환
   */
  convertToSupabaseFormat(defaultAssociationId: string = '00000000-0000-0000-0000-000000000001'): {
    reports: SupabaseReportData[];
    posts: SupabaseCommunityPostData[];
    comments: SupabaseCommentData[];
  } {
    const backupData = this.createFullBackup();

    // Reports 변환
    const supabaseReports: SupabaseReportData[] = backupData.reports.map(report => ({
      title: report.title,
      content: `${report.content}\n\n원하는 조치: ${report.desired_action}`,
      incident_date: report.incident_date,
      incident_location: report.location,
      witnesses: report.witnesses,
      evidence_files: report.fileNames ? { files: report.fileNames } : null,
      status: this.mapReportStatus(report.status),
      urgency_level: this.getUrgencyLevel(report.type),
      reporter_id: 'legacy_user_' + report.id.split('_')[1], // 임시 사용자 ID 생성
      association_id: defaultAssociationId,
      created_at: report.createdAt,
      updated_at: report.updatedAt
    }));

    // Community Posts 변환
    const supabasePosts: SupabaseCommunityPostData[] = backupData.communityPosts.map(post => ({
      title: post.title,
      content: post.content,
      category: post.category,
      author_id: post.authorId || 'legacy_user_' + post.id.split('_')[1],
      association_id: defaultAssociationId,
      is_anonymous: false, // 기본값
      view_count: 0, // 기본값
      like_count: post.likes,
      liked_by: post.likedBy,
      created_at: post.createdAt,
      updated_at: post.updatedAt
    }));

    // Comments 변환
    const supabaseComments: SupabaseCommentData[] = backupData.comments.map(comment => ({
      post_id: comment.postId,
      content: comment.content,
      author_id: comment.authorId || 'legacy_user_' + comment.id.split('_')[1],
      is_anonymous: false, // 기본값
      like_count: comment.likes,
      liked_by: comment.likedBy,
      created_at: comment.createdAt,
      updated_at: comment.updatedAt
    }));

    return {
      reports: supabaseReports,
      posts: supabasePosts,
      comments: supabaseComments
    };
  }

  /**
   * Supabase 형식 데이터를 SQL 형태로 생성
   */
  generateSupabaseMigrationSQL(defaultAssociationId: string = '00000000-0000-0000-0000-000000000001'): string {
    const { reports, posts, comments } = this.convertToSupabaseFormat(defaultAssociationId);

    let sql = `-- LocalStorage 데이터 마이그레이션 SQL\n`;
    sql += `-- Generated on: ${new Date().toISOString()}\n\n`;

    // 임시 사용자 생성 (실제로는 Supabase Auth에서 생성 필요)
    sql += `-- 레거시 사용자 프로필 생성 (실제 운영시 수정 필요)\n`;
    const legacyUsers = this.extractLegacyUsers(reports, posts, comments);
    legacyUsers.forEach(user => {
      sql += `INSERT INTO public.user_profiles (id, email, name, role, is_verified) VALUES\n`;
      sql += `('${user.id}', '${user.email}', '${user.name}', 'teacher', true);\n\n`;
    });

    // 신고 데이터 삽입
    if (reports.length > 0) {
      sql += `-- 신고 데이터 삽입\n`;
      sql += `INSERT INTO public.incident_reports (title, content, incident_date, incident_location, witnesses, evidence_files, status, urgency_level, reporter_id, association_id, created_at, updated_at) VALUES\n`;

      reports.forEach((report, index) => {
        sql += `('${this.escapeSqlString(report.title)}', '${this.escapeSqlString(report.content)}', '${report.incident_date}', '${this.escapeSqlString(report.incident_location)}', '${this.escapeSqlString(report.witnesses)}', ${report.evidence_files ? `'${JSON.stringify(report.evidence_files)}'::jsonb` : 'NULL'}, '${report.status}', ${report.urgency_level}, '${report.reporter_id}', '${report.association_id}', '${report.created_at}', '${report.updated_at}')`;
        sql += index < reports.length - 1 ? ',\n' : ';\n\n';
      });
    }

    // 커뮤니티 게시글 데이터 삽입
    if (posts.length > 0) {
      sql += `-- 커뮤니티 게시글 데이터 삽입\n`;
      sql += `INSERT INTO public.community_posts (title, content, category, author_id, association_id, is_anonymous, view_count, like_count, liked_by, created_at, updated_at) VALUES\n`;

      posts.forEach((post, index) => {
        sql += `('${this.escapeSqlString(post.title)}', '${this.escapeSqlString(post.content)}', '${post.category}', '${post.author_id}', '${post.association_id}', ${post.is_anonymous}, ${post.view_count}, ${post.like_count}, ARRAY[${post.liked_by.map(id => `'${id}'`).join(', ')}], '${post.created_at}', '${post.updated_at}')`;
        sql += index < posts.length - 1 ? ',\n' : ';\n\n';
      });
    }

    // 댓글 데이터는 post_id 매핑이 필요하므로 별도 처리
    if (comments.length > 0) {
      sql += `-- 댓글 데이터는 post_id 매핑 후 수동으로 삽입하세요\n`;
      sql += `-- 원본 댓글 데이터: ${comments.length}개\n\n`;
    }

    return sql;
  }

  /**
   * 백업 데이터 검증
   */
  validateBackupData(backupData: BackupData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!backupData.timestamp) {
      errors.push('Backup timestamp is missing');
    }

    if (!backupData.version) {
      errors.push('Backup version is missing');
    }

    if (!Array.isArray(backupData.reports)) {
      errors.push('Reports data is invalid');
    }

    if (!Array.isArray(backupData.communityPosts)) {
      errors.push('Community posts data is invalid');
    }

    if (!Array.isArray(backupData.comments)) {
      errors.push('Comments data is invalid');
    }

    if (!backupData.metadata) {
      errors.push('Backup metadata is missing');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 백업으로부터 데이터 복원
   */
  restoreFromBackup(backupData: BackupData): boolean {
    try {
      const validation = this.validateBackupData(backupData);
      if (!validation.isValid) {
        throw new Error(`Invalid backup data: ${validation.errors.join(', ')}`);
      }

      // 기존 데이터 백업
      const currentBackup = this.createFullBackup();
      localStorage.setItem('kk119_backup_before_restore', JSON.stringify(currentBackup));

      // 데이터 복원
      localStorage.setItem('kk119_reports', JSON.stringify(backupData.reports));
      localStorage.setItem('kk119_community_posts', JSON.stringify(backupData.communityPosts));
      localStorage.setItem('kk119_community_comments', JSON.stringify(backupData.comments));

      console.log('Data restored successfully from backup');
      return true;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }

  // 헬퍼 메서드들
  private mapReportStatus(localStatus: string): 'submitted' | 'investigating' | 'consulting' | 'resolved' | 'closed' {
    const statusMap: Record<string, 'submitted' | 'investigating' | 'consulting' | 'resolved' | 'closed'> = {
      'pending': 'submitted',
      'processing': 'investigating',
      'resolved': 'resolved',
      'rejected': 'closed'
    };
    return statusMap[localStatus] || 'submitted';
  }

  private getUrgencyLevel(reportType: string): number {
    const urgencyMap: Record<string, number> = {
      'parent': 3,
      'student': 2,
      'verbal': 1,
      'physical': 5,
      'cyber': 2
    };
    return urgencyMap[reportType] || 1;
  }

  private extractLegacyUsers(reports: SupabaseReportData[], posts: SupabaseCommunityPostData[], comments: SupabaseCommentData[]) {
    const userSet = new Set<string>();

    reports.forEach(r => userSet.add(r.reporter_id));
    posts.forEach(p => userSet.add(p.author_id));
    comments.forEach(c => userSet.add(c.author_id));

    return Array.from(userSet).map(userId => ({
      id: userId,
      email: `${userId}@legacy.kk119.com`,
      name: `레거시 사용자 ${userId.split('_')[2] || 'unknown'}`
    }));
  }

  private escapeSqlString(str: string): string {
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
  }

  /**
   * 마이그레이션 상태 확인
   */
  getMigrationStatus(): {
    hasLocalData: boolean;
    hasBackup: boolean;
    dataStats: {
      reports: number;
      posts: number;
      comments: number;
    };
  } {
    const reports = localDB.getAllReports();
    const posts = localDB.getAllPosts();
    const comments = localDB.getAllComments();
    const backup = this.getStoredBackup();

    return {
      hasLocalData: reports.length > 0 || posts.length > 0 || comments.length > 0,
      hasBackup: backup !== null,
      dataStats: {
        reports: reports.length,
        posts: posts.length,
        comments: comments.length
      }
    };
  }

  /**
   * 백업 데이터 삭제
   */
  clearBackup(): void {
    localStorage.removeItem(this.BACKUP_KEY);
    localStorage.removeItem('kk119_backup_before_restore');
    console.log('Backup data cleared');
  }
}

export const backupService = new LocalStorageBackupService();