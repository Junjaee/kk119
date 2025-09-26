// Supabase Database Service
// localStorage 대체를 위한 Supabase 기반 데이터베이스 서비스

import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/types/user';

// 기존 localStorage 인터페이스와 호환되는 타입들
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
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  fileNames?: string[];
  // Supabase 추가 필드들
  reporter_id?: string;
  association_id?: string;
  urgency_level?: number;
  assigned_lawyer_id?: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  category: 'general' | 'experience' | 'advice' | 'legal' | 'support';
  likes: number;
  likedBy: string[];
  associationId?: string;
  createdAt: string;
  updatedAt: string;
  // Supabase 추가 필드들
  is_anonymous?: boolean;
  view_count?: number;
  tags?: string[];
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
  // Supabase 추가 필드들
  parent_comment_id?: string;
  is_anonymous?: boolean;
}

class SupabaseDB {
  private supabase = createClient();

  // ========== REPORT METHODS ==========

  // Get all reports (현재 사용자 기준)
  async getAllReports(): Promise<Report[]> {
    try {
      const { data, error } = await this.supabase
        .from('incident_reports')
        .select(`
          *,
          reporter:user_profiles!incident_reports_reporter_id_fkey(name),
          assigned_lawyer:user_profiles!incident_reports_assigned_lawyer_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return [];
      }

      return data.map(this.mapSupabaseReportToLocal);
    } catch (error) {
      console.error('Exception fetching reports:', error);
      return [];
    }
  }

  // Get report by ID
  async getReportById(id: string): Promise<Report | null> {
    try {
      const { data, error } = await this.supabase
        .from('incident_reports')
        .select(`
          *,
          reporter:user_profiles!incident_reports_reporter_id_fkey(name),
          assigned_lawyer:user_profiles!incident_reports_assigned_lawyer_id_fkey(name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching report:', error);
        return null;
      }

      return this.mapSupabaseReportToLocal(data);
    } catch (error) {
      console.error('Exception fetching report:', error);
      return null;
    }
  }

  // Create new report
  async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>, userId: string, associationId?: string): Promise<Report | null> {
    try {
      const { data, error } = await this.supabase
        .from('incident_reports')
        .insert({
          reporter_id: userId,
          association_id: associationId,
          title: reportData.title,
          content: reportData.content,
          incident_date: reportData.incident_date,
          incident_location: reportData.location,
          witnesses: reportData.witnesses,
          evidence_files: reportData.fileNames ? { files: reportData.fileNames } : null,
          status: 'submitted',
          urgency_level: 1
        })
        .select(`
          *,
          reporter:user_profiles!incident_reports_reporter_id_fkey(name),
          assigned_lawyer:user_profiles!incident_reports_assigned_lawyer_id_fkey(name)
        `)
        .single();

      if (error) {
        console.error('Error creating report:', error);
        return null;
      }

      return this.mapSupabaseReportToLocal(data);
    } catch (error) {
      console.error('Exception creating report:', error);
      return null;
    }
  }

  // Update report
  async updateReport(id: string, updates: Partial<Omit<Report, 'id' | 'createdAt'>>): Promise<Report | null> {
    try {
      const updateData: any = {};

      if (updates.title) updateData.title = updates.title;
      if (updates.content) updateData.content = updates.content;
      if (updates.incident_date) updateData.incident_date = updates.incident_date;
      if (updates.location) updateData.incident_location = updates.location;
      if (updates.witnesses) updateData.witnesses = updates.witnesses;
      if (updates.status) updateData.status = this.mapLocalStatusToSupabase(updates.status);
      if (updates.fileNames) updateData.evidence_files = { files: updates.fileNames };

      const { data, error } = await this.supabase
        .from('incident_reports')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          reporter:user_profiles!incident_reports_reporter_id_fkey(name),
          assigned_lawyer:user_profiles!incident_reports_assigned_lawyer_id_fkey(name)
        `)
        .single();

      if (error) {
        console.error('Error updating report:', error);
        return null;
      }

      return this.mapSupabaseReportToLocal(data);
    } catch (error) {
      console.error('Exception updating report:', error);
      return null;
    }
  }

  // Delete report
  async deleteReport(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('incident_reports')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Exception deleting report:', error);
      return false;
    }
  }

  // Get reports by status
  async getReportsByStatus(status: Report['status']): Promise<Report[]> {
    try {
      const supabaseStatus = this.mapLocalStatusToSupabase(status);

      const { data, error } = await this.supabase
        .from('incident_reports')
        .select(`
          *,
          reporter:user_profiles!incident_reports_reporter_id_fkey(name),
          assigned_lawyer:user_profiles!incident_reports_assigned_lawyer_id_fkey(name)
        `)
        .eq('status', supabaseStatus)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports by status:', error);
        return [];
      }

      return data.map(this.mapSupabaseReportToLocal);
    } catch (error) {
      console.error('Exception fetching reports by status:', error);
      return [];
    }
  }

  // Get reports count by status
  async getReportsCountByStatus(): Promise<{ pending: number; processing: number; resolved: number; rejected: number }> {
    try {
      const { data, error } = await this.supabase
        .from('incident_reports')
        .select('status');

      if (error) {
        console.error('Error fetching reports count:', error);
        return { pending: 0, processing: 0, resolved: 0, rejected: 0 };
      }

      const counts = { pending: 0, processing: 0, resolved: 0, rejected: 0 };

      data.forEach(report => {
        const localStatus = this.mapSupabaseStatusToLocal(report.status);
        if (localStatus in counts) {
          counts[localStatus as keyof typeof counts]++;
        }
      });

      return counts;
    } catch (error) {
      console.error('Exception fetching reports count:', error);
      return { pending: 0, processing: 0, resolved: 0, rejected: 0 };
    }
  }

  // ========== COMMUNITY POST METHODS ==========

  // Get all posts (협회 기준)
  async getAllPosts(associationId?: string): Promise<CommunityPost[]> {
    try {
      let query = this.supabase
        .from('community_posts')
        .select(`
          *,
          author:user_profiles!community_posts_author_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (associationId) {
        query = query.eq('association_id', associationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        return [];
      }

      return data.map(this.mapSupabasePostToLocal);
    } catch (error) {
      console.error('Exception fetching posts:', error);
      return [];
    }
  }

  // Get post by ID
  async getPostById(id: string): Promise<CommunityPost | null> {
    try {
      const { data, error } = await this.supabase
        .from('community_posts')
        .select(`
          *,
          author:user_profiles!community_posts_author_id_fkey(name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        return null;
      }

      // 조회수 증가
      await this.supabase
        .from('community_posts')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);

      return this.mapSupabasePostToLocal(data);
    } catch (error) {
      console.error('Exception fetching post:', error);
      return null;
    }
  }

  // Create new post
  async createPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>, userId: string, associationId?: string): Promise<CommunityPost | null> {
    try {
      const { data, error } = await this.supabase
        .from('community_posts')
        .insert({
          author_id: userId,
          association_id: associationId,
          title: postData.title,
          content: postData.content,
          category: postData.category,
          is_anonymous: false,
          like_count: 0,
          liked_by: [],
          view_count: 0
        })
        .select(`
          *,
          author:user_profiles!community_posts_author_id_fkey(name)
        `)
        .single();

      if (error) {
        console.error('Error creating post:', error);
        return null;
      }

      return this.mapSupabasePostToLocal(data);
    } catch (error) {
      console.error('Exception creating post:', error);
      return null;
    }
  }

  // Update post
  async updatePost(id: string, updates: Partial<Omit<CommunityPost, 'id' | 'createdAt'>>): Promise<CommunityPost | null> {
    try {
      const updateData: any = {};

      if (updates.title) updateData.title = updates.title;
      if (updates.content) updateData.content = updates.content;
      if (updates.category) updateData.category = updates.category;

      const { data, error } = await this.supabase
        .from('community_posts')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          author:user_profiles!community_posts_author_id_fkey(name)
        `)
        .single();

      if (error) {
        console.error('Error updating post:', error);
        return null;
      }

      return this.mapSupabasePostToLocal(data);
    } catch (error) {
      console.error('Exception updating post:', error);
      return null;
    }
  }

  // Toggle post like
  async togglePostLike(postId: string, userId: string): Promise<CommunityPost | null> {
    try {
      // 현재 포스트 정보 가져오기
      const { data: currentPost, error: fetchError } = await this.supabase
        .from('community_posts')
        .select('liked_by, like_count')
        .eq('id', postId)
        .single();

      if (fetchError || !currentPost) {
        console.error('Error fetching post for like toggle:', fetchError);
        return null;
      }

      const likedBy = currentPost.liked_by || [];
      const hasLiked = likedBy.includes(userId);

      const newLikedBy = hasLiked
        ? likedBy.filter(id => id !== userId)
        : [...likedBy, userId];

      const newLikeCount = hasLiked
        ? Math.max(0, (currentPost.like_count || 0) - 1)
        : (currentPost.like_count || 0) + 1;

      const { data, error } = await this.supabase
        .from('community_posts')
        .update({
          liked_by: newLikedBy,
          like_count: newLikeCount
        })
        .eq('id', postId)
        .select(`
          *,
          author:user_profiles!community_posts_author_id_fkey(name)
        `)
        .single();

      if (error) {
        console.error('Error toggling post like:', error);
        return null;
      }

      return this.mapSupabasePostToLocal(data);
    } catch (error) {
      console.error('Exception toggling post like:', error);
      return null;
    }
  }

  // Delete post
  async deletePost(id: string): Promise<boolean> {
    try {
      // 댓글도 함께 삭제 (CASCADE)
      const { error } = await this.supabase
        .from('community_posts')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Exception deleting post:', error);
      return false;
    }
  }

  // ========== COMMENT METHODS ==========

  // Get all comments
  async getAllComments(): Promise<Comment[]> {
    try {
      const { data, error } = await this.supabase
        .from('community_comments')
        .select(`
          *,
          author:user_profiles!community_comments_author_id_fkey(name)
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      return data.map(this.mapSupabaseCommentToLocal);
    } catch (error) {
      console.error('Exception fetching comments:', error);
      return [];
    }
  }

  // Get comments by post ID
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    try {
      const { data, error } = await this.supabase
        .from('community_comments')
        .select(`
          *,
          author:user_profiles!community_comments_author_id_fkey(name)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      return data.map(this.mapSupabaseCommentToLocal);
    } catch (error) {
      console.error('Exception fetching comments:', error);
      return [];
    }
  }

  // Create new comment
  async createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>, userId: string): Promise<Comment | null> {
    try {
      const { data, error } = await this.supabase
        .from('community_comments')
        .insert({
          post_id: commentData.postId,
          author_id: userId,
          content: commentData.content,
          is_anonymous: false,
          like_count: 0,
          liked_by: []
        })
        .select(`
          *,
          author:user_profiles!community_comments_author_id_fkey(name)
        `)
        .single();

      if (error) {
        console.error('Error creating comment:', error);
        return null;
      }

      return this.mapSupabaseCommentToLocal(data);
    } catch (error) {
      console.error('Exception creating comment:', error);
      return null;
    }
  }

  // Toggle comment like
  async toggleCommentLike(commentId: string, userId: string): Promise<Comment | null> {
    try {
      // 현재 댓글 정보 가져오기
      const { data: currentComment, error: fetchError } = await this.supabase
        .from('community_comments')
        .select('liked_by, like_count')
        .eq('id', commentId)
        .single();

      if (fetchError || !currentComment) {
        console.error('Error fetching comment for like toggle:', fetchError);
        return null;
      }

      const likedBy = currentComment.liked_by || [];
      const hasLiked = likedBy.includes(userId);

      const newLikedBy = hasLiked
        ? likedBy.filter(id => id !== userId)
        : [...likedBy, userId];

      const newLikeCount = hasLiked
        ? Math.max(0, (currentComment.like_count || 0) - 1)
        : (currentComment.like_count || 0) + 1;

      const { data, error } = await this.supabase
        .from('community_comments')
        .update({
          liked_by: newLikedBy,
          like_count: newLikeCount
        })
        .eq('id', commentId)
        .select(`
          *,
          author:user_profiles!community_comments_author_id_fkey(name)
        `)
        .single();

      if (error) {
        console.error('Error toggling comment like:', error);
        return null;
      }

      return this.mapSupabaseCommentToLocal(data);
    } catch (error) {
      console.error('Exception toggling comment like:', error);
      return null;
    }
  }

  // Delete comment
  async deleteComment(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('community_comments')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Exception deleting comment:', error);
      return false;
    }
  }

  // ========== MAPPING FUNCTIONS ==========

  private mapSupabaseReportToLocal(data: any): Report {
    return {
      id: data.id,
      type: 'general', // 기본값
      title: data.title,
      incident_date: data.incident_date || '',
      incident_time: '', // Supabase에는 별도 시간 필드 없음
      location: data.incident_location || '',
      witnesses: data.witnesses || '',
      content: data.content,
      desired_action: '', // 기본값
      status: this.mapSupabaseStatusToLocal(data.status),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      fileNames: data.evidence_files?.files || [],
      reporter_id: data.reporter_id,
      association_id: data.association_id,
      urgency_level: data.urgency_level,
      assigned_lawyer_id: data.assigned_lawyer_id
    };
  }

  private mapSupabasePostToLocal(data: any): CommunityPost {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      author: data.author?.name || 'Unknown',
      authorId: data.author_id,
      category: data.category,
      likes: data.like_count || 0,
      likedBy: data.liked_by || [],
      associationId: data.association_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      is_anonymous: data.is_anonymous,
      view_count: data.view_count,
      tags: data.tags
    };
  }

  private mapSupabaseCommentToLocal(data: any): Comment {
    return {
      id: data.id,
      postId: data.post_id,
      content: data.content,
      author: data.author?.name || 'Unknown',
      authorId: data.author_id,
      likes: data.like_count || 0,
      likedBy: data.liked_by || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      parent_comment_id: data.parent_comment_id,
      is_anonymous: data.is_anonymous
    };
  }

  private mapLocalStatusToSupabase(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'submitted',
      'processing': 'investigating',
      'resolved': 'resolved',
      'rejected': 'closed'
    };
    return statusMap[status] || 'submitted';
  }

  private mapSupabaseStatusToLocal(status: string): 'pending' | 'processing' | 'resolved' | 'rejected' {
    const statusMap: Record<string, 'pending' | 'processing' | 'resolved' | 'rejected'> = {
      'submitted': 'pending',
      'investigating': 'processing',
      'consulting': 'processing',
      'resolved': 'resolved',
      'closed': 'rejected'
    };
    return statusMap[status] || 'pending';
  }

  // ========== UTILITY METHODS ==========

  // Get user's association
  async getUserAssociation(userId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('association_members')
        .select('association_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.error('Error fetching user association:', error);
        return null;
      }

      return data.association_id;
    } catch (error) {
      console.error('Exception fetching user association:', error);
      return null;
    }
  }

  // Initialize with sample data (for development/demo)
  async initWithSampleData(userId: string, associationId?: string): Promise<void> {
    console.log('Sample data initialization skipped for Supabase (use migration service instead)');
  }
}

export const supabaseDB = new SupabaseDB();