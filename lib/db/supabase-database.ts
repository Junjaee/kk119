/**
 * Supabase Database Wrapper
 *
 * SQLite(better-sqlite3)를 Supabase PostgreSQL로 대체
 * 기존 database.ts의 인터페이스를 유지하면서 Supabase로 구현
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials not found in environment variables');
}

// Service role 클라이언트 (서버 사이드 전용, 모든 권한)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('✅ Supabase database client initialized');

/**
 * Database initialization
 * Supabase에서는 마이그레이션으로 테이블이 이미 생성되어 있음
 */
export function initDatabase() {
  console.log('✅ Using Supabase PostgreSQL database');
  console.log('   Tables created via migrations');
  // No-op: 테이블은 이미 Supabase SQL 에디터에서 생성됨
}

/**
 * User operations - Supabase implementation
 */
export const userDb = {
  /**
   * Create new user
   */
  create: async (userData: {
    email: string;
    password: string;
    name: string;
    school?: string;
    position?: string;
    phone?: string;
    associations?: string[];
    role?: string;
    association_id?: number;
  }) => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        school: userData.school || null,
        position: userData.position || null,
        phone: userData.phone || null,
        association: userData.associations ? JSON.stringify(userData.associations) : null,
        role: userData.role || 'teacher',
        association_id: userData.association_id || null,
        is_verified: false,
        is_admin: false
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new Error('이미 등록된 이메일입니다.');
      }
      throw error;
    }

    return data;
  },

  /**
   * Find user by email
   */
  findByEmail: async (email: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error finding user by email:', error);
      return null;
    }

    return data;
  },

  /**
   * Find user by ID
   */
  findById: async (id: number) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding user by ID:', error);
      return null;
    }

    return data;
  },

  /**
   * Update last login timestamp
   */
  updateLastLogin: async (userId: number) => {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating last login:', error);
    }

    return { changes: error ? 0 : 1 };
  },

  /**
   * Update user password
   */
  updatePassword: async (userId: number, newPassword: string) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { changes: 1 };
  },

  /**
   * Verify user email
   */
  verifyEmail: async (userId: number) => {
    const { error } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { changes: 1 };
  },

  /**
   * Update user profile
   */
  update: async (userId: number, userData: {
    name?: string;
    school?: string;
    position?: string;
    phone?: string;
  }) => {
    const updates: any = {};

    if (userData.name !== undefined) updates.name = userData.name;
    if (userData.school !== undefined) updates.school = userData.school;
    if (userData.position !== undefined) updates.position = userData.position;
    if (userData.phone !== undefined) updates.phone = userData.phone;

    if (Object.keys(updates).length === 0) return null;

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { changes: 1 };
  },

  /**
   * Get total user count
   */
  getUserCount: async () => {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting user count:', error);
      return 0;
    }

    return count || 0;
  }
};

/**
 * Session operations - Supabase implementation
 */
export const sessionDb = {
  /**
   * Create new session
   */
  create: async (userId: number, token: string, expiresIn: number = 7 * 24 * 60 * 60 * 1000) => {
    const expiresAt = new Date(Date.now() + expiresIn).toISOString();

    const { error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        token: token,
        expires_at: expiresAt
      });

    if (error) {
      throw error;
    }

    return { lastInsertRowid: userId };
  },

  /**
   * Find session by token with user data
   */
  findByToken: async (token: string) => {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        users!inner(*)
      `)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding session:', error);
      return null;
    }

    // Flatten the response to match SQLite format
    if (data && data.users) {
      return {
        ...data,
        ...(Array.isArray(data.users) ? data.users[0] : data.users)
      };
    }

    return data;
  },

  /**
   * Delete session by token
   */
  delete: async (token: string) => {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('token', token);

    if (error) {
      console.error('Error deleting session:', error);
    }

    return { changes: error ? 0 : 1 };
  },

  /**
   * Delete expired sessions
   */
  deleteExpired: async () => {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .lte('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error deleting expired sessions:', error);
    }

    return { changes: error ? 0 : 1 };
  },

  /**
   * Delete all sessions for a user
   */
  deleteAllUserSessions: async (userId: number) => {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting user sessions:', error);
    }

    return { changes: error ? 0 : 1 };
  }
};

/**
 * Token operations - Supabase implementation
 */
export const tokenDb = {
  /**
   * Create email verification token
   */
  createVerificationToken: async (userId: number, token: string) => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const { error } = await supabase
      .from('verification_tokens')
      .insert({
        user_id: userId,
        token: token,
        expires_at: expiresAt
      });

    if (error) {
      throw error;
    }

    return { lastInsertRowid: userId };
  },

  /**
   * Create password reset token
   */
  createPasswordResetToken: async (userId: number, token: string) => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const { error } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        token: token,
        expires_at: expiresAt
      });

    if (error) {
      throw error;
    }

    return { lastInsertRowid: userId };
  },

  /**
   * Find verification token
   */
  findVerificationToken: async (token: string) => {
    const { data, error } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding verification token:', error);
      return null;
    }

    return data;
  },

  /**
   * Find password reset token
   */
  findPasswordResetToken: async (token: string) => {
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding password reset token:', error);
      return null;
    }

    return data;
  },

  /**
   * Delete verification token
   */
  deleteVerificationToken: async (token: string) => {
    const { error } = await supabase
      .from('verification_tokens')
      .delete()
      .eq('token', token);

    if (error) {
      console.error('Error deleting verification token:', error);
    }

    return { changes: error ? 0 : 1 };
  },

  /**
   * Delete password reset token
   */
  deletePasswordResetToken: async (token: string) => {
    const { error } = await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', token);

    if (error) {
      console.error('Error deleting password reset token:', error);
    }

    return { changes: error ? 0 : 1 };
  }
};


/**
 * Community operations - Supabase implementation
 */
export const communityDb = {
  /**
   * Create new community post
   */
  create: async (postData: {
    id: string;
    title: string;
    content: string;
    author: string;
    author_id: string;
    category: string;
  }) => {
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        id: postData.id,
        title: postData.title,
        content: postData.content,
        author: postData.author,
        author_id: postData.author_id,
        category: postData.category,
        likes: 0,
        liked_by: []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating community post:', error);
      throw error;
    }

    return data;
  },

  /**
   * Find all community posts with filters
   */
  findAll: async (filters?: { category?: string; search?: string; limit?: number; offset?: number }) => {
    let query = supabase
      .from('community_posts')
      .select('*');

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error finding community posts:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Find post by ID
   */
  findById: async (id: string) => {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding community post:', error);
      return null;
    }

    return data;
  },

  /**
   * Update post
   */
  update: async (id: string, postData: {
    title?: string;
    content?: string;
    category?: string;
  }) => {
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (postData.title !== undefined) updates.title = postData.title;
    if (postData.content !== undefined) updates.content = postData.content;
    if (postData.category !== undefined) updates.category = postData.category;

    const { data, error } = await supabase
      .from('community_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating community post:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete post
   */
  delete: async (id: string, authorId: string) => {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', id)
      .eq('author_id', authorId);

    if (error) {
      console.error('Error deleting community post:', error);
      throw error;
    }

    return { success: true };
  },

  /**
   * Toggle like on post
   */
  toggleLike: async (postId: string, userId: string) => {
    // First, get the current post
    const { data: post, error: fetchError } = await supabase
      .from('community_posts')
      .select('likes, liked_by')
      .eq('id', postId)
      .single();

    if (fetchError) {
      console.error('Error fetching post for like:', fetchError);
      throw fetchError;
    }

    const likedBy = post.liked_by || [];
    const hasLiked = likedBy.includes(userId);

    const { data, error } = await supabase
      .from('community_posts')
      .update({
        likes: hasLiked ? post.likes - 1 : post.likes + 1,
        liked_by: hasLiked
          ? likedBy.filter((id: string) => id !== userId)
          : [...likedBy, userId],
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling like:', error);
      throw error;
    }

    return data;
  },

  /**
   * Get post count by category
   */
  getCountByCategory: async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select('category');

    if (error) {
      console.error('Error getting post count:', error);
      return {};
    }

    const counts: Record<string, number> = {};
    data.forEach((post: any) => {
      counts[post.category] = (counts[post.category] || 0) + 1;
    });

    return counts;
  }
};

/**
 * Community comments operations - Supabase implementation
 */
export const communityCommentDb = {
  /**
   * Create new comment
   */
  create: async (commentData: {
    id: string;
    post_id: string;
    content: string;
    author: string;
    author_id: string;
    parent_comment_id?: string;
  }) => {
    const { data, error } = await supabase
      .from('community_comments')
      .insert({
        id: commentData.id,
        post_id: commentData.post_id,
        content: commentData.content,
        author: commentData.author,
        author_id: commentData.author_id,
        parent_comment_id: commentData.parent_comment_id || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      throw error;
    }

    return data;
  },

  /**
   * Find comments by post ID
   */
  findByPostId: async (postId: string) => {
    const { data, error } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error finding comments:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Update comment
   */
  update: async (id: string, content: string) => {
    const { data, error } = await supabase
      .from('community_comments')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete comment
   */
  delete: async (id: string, authorId: string) => {
    const { error } = await supabase
      .from('community_comments')
      .delete()
      .eq('id', id)
      .eq('author_id', authorId);

    if (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }

    return { success: true };
  },

  /**
   * Get comment count for post
   */
  getCountByPostId: async (postId: string) => {
    const { count, error } = await supabase
      .from('community_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }

    return count || 0;
  }
};

/**
 * Lawyer operations - Supabase implementation
 */
export const lawyerDb = {
  /**
   * Create lawyer profile
   */
  create: async (data: {
    user_id?: number;
    name: string;
    specialty: string;
    license_number?: string;
    bio?: string;
    years_of_experience?: number;
  }) => {
    const { data: lawyer, error } = await supabase
      .from('lawyers')
      .insert({
        user_id: data.user_id || null,
        name: data.name,
        specialty: data.specialty,
        license_number: data.license_number || null,
        bio: data.bio || null,
        years_of_experience: data.years_of_experience || null,
        is_verified: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lawyer:', error);
      throw error;
    }

    return lawyer;
  },

  /**
   * Find all lawyers
   */
  findAll: async () => {
    const { data, error } = await supabase
      .from('lawyers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error finding lawyers:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Find lawyer by ID
   */
  findById: async (id: string) => {
    const { data, error } = await supabase
      .from('lawyers')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding lawyer:', error);
      return null;
    }

    return data;
  },

  /**
   * Find lawyer by user_id
   */
  findByUserId: async (userId: number) => {
    const { data, error } = await supabase
      .from('lawyers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding lawyer by user_id:', error);
      return null;
    }

    return data;
  }
};

/**
 * Consult operations - Supabase implementation
 */
export const consultDb = {
  /**
   * Create new consult
   */
  create: async (data: {
    report_id?: number;
    user_id: number;
    title: string;
    report_type: string;
    incident_date: string;
    report_content: string;
    report_status?: string;
  }) => {
    const { data: consult, error } = await supabase
      .from('consults')
      .insert({
        report_id: data.report_id || null,
        user_id: data.user_id,
        title: data.title,
        report_type: data.report_type,
        incident_date: data.incident_date,
        report_content: data.report_content,
        report_status: data.report_status || 'pending',
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating consult:', error);
      throw error;
    }

    return consult;
  },

  /**
   * Find all consults with lawyer info
   */
  findAll: async (userId?: number, status?: string) => {
    let query = supabase
      .from('consults')
      .select(`
        *,
        lawyers(name, specialty)
      `);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error finding consults:', error);
      return [];
    }

    // Get reply count for each consult
    const consultsWithCounts = await Promise.all(
      (data || []).map(async (consult: any) => {
        const { count } = await supabase
          .from('consult_replies')
          .select('*', { count: 'exact', head: true })
          .eq('consult_id', consult.id);

        return {
          ...consult,
          lawyer_name: consult.lawyers?.name,
          lawyer_specialty: consult.lawyers?.specialty,
          reply_count: count || 0
        };
      })
    );

    return consultsWithCounts;
  },

  /**
   * Find single consult by ID
   */
  findById: async (id: string) => {
    const { data, error } = await supabase
      .from('consults')
      .select(`
        *,
        lawyers(name, specialty, bio)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding consult:', error);
      return null;
    }

    if (data) {
      return {
        ...data,
        lawyer_name: data.lawyers?.name,
        lawyer_specialty: data.lawyers?.specialty,
        lawyer_bio: data.lawyers?.bio
      };
    }

    return null;
  },

  /**
   * Update consult
   */
  update: async (id: string, updateData: any) => {
    const { error } = await supabase
      .from('consults')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating consult:', error);
      throw error;
    }

    return { changes: 1 };
  },

  /**
   * Assign lawyer to consult
   */
  assignLawyer: async (consultId: string, lawyerId: string, consultContent: string) => {
    const { error } = await supabase
      .from('consults')
      .update({
        lawyer_id: lawyerId,
        consult_content: consultContent,
        status: 'answered',
        answered_at: new Date().toISOString()
      })
      .eq('id', consultId);

    if (error) {
      console.error('Error assigning lawyer:', error);
      throw error;
    }

    return { changes: 1 };
  },

  /**
   * Get consult statistics
   */
  getStats: async (userId?: number) => {
    let totalQuery = supabase
      .from('consults')
      .select('*', { count: 'exact', head: true });

    let answeredQuery = supabase
      .from('consults')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'answered');

    let pendingQuery = supabase
      .from('consults')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'reviewing']);

    if (userId) {
      totalQuery = totalQuery.eq('user_id', userId);
      answeredQuery = answeredQuery.eq('user_id', userId);
      pendingQuery = pendingQuery.eq('user_id', userId);
    }

    const [totalResult, answeredResult, pendingResult] = await Promise.all([
      totalQuery,
      answeredQuery,
      pendingQuery
    ]);

    return {
      total: totalResult.count || 0,
      answered: answeredResult.count || 0,
      pending: pendingResult.count || 0
    };
  },

  /**
   * Assign lawyer only (admin function)
   */
  assignLawyerOnly: async (consultId: string, lawyerId: string) => {
    const { error } = await supabase
      .from('consults')
      .update({
        lawyer_id: lawyerId,
        status: 'reviewing'
      })
      .eq('id', consultId);

    if (error) {
      console.error('Error assigning lawyer only:', error);
      throw error;
    }

    return { changes: 1 };
  },

  /**
   * Find unassigned consults
   */
  findUnassigned: async () => {
    const { data, error } = await supabase
      .from('consults')
      .select('*')
      .is('lawyer_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error finding unassigned consults:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Find consults by lawyer
   */
  findByLawyer: async (lawyerId: string) => {
    const { data, error } = await supabase
      .from('consults')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .order('created_at', { ascending: false});

    if (error) {
      console.error('Error finding consults by lawyer:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Find available consults for lawyers
   */
  findAvailable: async (type?: string, limit: number = 20, offset: number = 0) => {
    let query = supabase
      .from('consults')
      .select('id, title, report_type, incident_date, report_content, created_at, status')
      .is('lawyer_id', null);

    if (type) {
      query = query.eq('report_type', type);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error finding available consults:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Count available consults
   */
  countAvailable: async (type?: string) => {
    let query = supabase
      .from('consults')
      .select('*', { count: 'exact', head: true })
      .is('lawyer_id', null);

    if (type) {
      query = query.eq('report_type', type);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting available consults:', error);
      return 0;
    }

    return count || 0;
  },

  /**
   * Claim consult (lawyer selects)
   */
  claimConsult: async (consultId: string, lawyerId: string) => {
    // Check if already assigned
    const { data: existing } = await supabase
      .from('consults')
      .select('lawyer_id')
      .eq('id', consultId)
      .single();

    if (existing?.lawyer_id) {
      throw new Error('Consult already assigned');
    }

    const { error } = await supabase
      .from('consults')
      .update({
        lawyer_id: lawyerId,
        claimed_at: new Date().toISOString(),
        status: 'reviewing'
      })
      .eq('id', consultId)
      .is('lawyer_id', null);

    if (error) {
      console.error('Error claiming consult:', error);
      throw error;
    }

    return { changes: 1 };
  }
};

/**
 * Consult reply operations - Supabase implementation
 */
export const consultReplyDb = {
  /**
   * Create reply
   */
  create: async (consultId: string, userId: number, content: string, isLawyer: boolean = false) => {
    const { data: reply, error } = await supabase
      .from('consult_replies')
      .insert({
        consult_id: consultId,
        user_id: userId,
        content: content,
        is_lawyer: isLawyer
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reply:', error);
      throw error;
    }

    // Update consult status based on who replied
    if (isLawyer) {
      await supabase
        .from('consults')
        .update({ status: 'answered' })
        .eq('id', consultId);
    } else {
      const { data: consult } = await supabase
        .from('consults')
        .select('status')
        .eq('id', consultId)
        .single();

      if (consult?.status === 'answered') {
        await supabase
          .from('consults')
          .update({ status: 'follow_up' })
          .eq('id', consultId);
      }
    }

    return reply;
  },

  /**
   * Find replies by consult ID
   */
  findByConsultId: async (consultId: string) => {
    const { data, error } = await supabase
      .from('consult_replies')
      .select('*')
      .eq('consult_id', consultId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error finding replies:', error);
      return [];
    }

    return data || [];
  }
};

/**
 * Consult attachment operations - Supabase implementation
 */
export const consultAttachmentDb = {
  /**
   * Find attachments by consult ID
   */
  findByConsultId: async (consultId: string) => {
    const { data, error } = await supabase
      .from('consult_attachments')
      .select('*')
      .eq('consult_id', consultId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error finding attachments:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Find single attachment by ID
   */
  findById: async (id: string) => {
    const { data, error } = await supabase
      .from('consult_attachments')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding attachment:', error);
      return null;
    }

    return data;
  },

  /**
   * Create attachment
   */
  create: async (data: {
    consult_id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
  }) => {
    const { data: attachment, error } = await supabase
      .from('consult_attachments')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating attachment:', error);
      throw error;
    }

    return attachment;
  },

  /**
   * Delete attachment
   */
  delete: async (id: string) => {
    const { error } = await supabase
      .from('consult_attachments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }

    return { changes: 1 };
  }
};

// Export Supabase client for direct use if needed
export { supabase };
export default supabase;
