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
 * Resource operations - Supabase implementation
 */
export const resourceDb = {
  /**
   * Create new resource
   */
  create: async (resourceData: {
    title: string;
    description?: string;
    category: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    uploadedBy: number;
  }) => {
    const { data, error } = await supabase
      .from('resources')
      .insert({
        title: resourceData.title,
        description: resourceData.description || null,
        category: resourceData.category,
        file_name: resourceData.fileName,
        file_path: resourceData.filePath,
        file_size: resourceData.fileSize,
        file_type: resourceData.fileType,
        uploaded_by: resourceData.uploadedBy,
        download_count: 0,
        is_approved: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Find all resources with filters
   */
  findAll: async (filters?: { category?: string; search?: string; limit?: number; offset?: number }) => {
    let query = supabase
      .from('resources')
      .select(`
        *,
        users!inner(name)
      `)
      .eq('is_approved', true);

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
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
      console.error('Error finding resources:', error);
      return [];
    }

    // Flatten user data
    return data.map((resource: any) => ({
      ...resource,
      uploader_name: resource.users?.name || 'Unknown'
    }));
  },

  /**
   * Find resource by ID
   */
  findById: async (id: number) => {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        users!inner(name)
      `)
      .eq('id', id)
      .eq('is_approved', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding resource:', error);
      return null;
    }

    if (data) {
      return {
        ...data,
        uploader_name: data.users?.name || 'Unknown'
      };
    }

    return null;
  },

  /**
   * Increment download count
   */
  incrementDownloadCount: async (id: number) => {
    const { error } = await supabase.rpc('increment_download_count', { resource_id: id });

    if (error) {
      // Fallback: manual increment
      const { data: resource } = await supabase
        .from('resources')
        .select('download_count')
        .eq('id', id)
        .single();

      if (resource) {
        await supabase
          .from('resources')
          .update({ download_count: (resource.download_count || 0) + 1 })
          .eq('id', id);
      }
    }

    return { changes: 1 };
  },

  /**
   * Find resources by user
   */
  findByUser: async (userId: number) => {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        users!inner(name)
      `)
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error finding user resources:', error);
      return [];
    }

    return data.map((resource: any) => ({
      ...resource,
      uploader_name: resource.users?.name || 'Unknown'
    }));
  },

  /**
   * Delete resource
   */
  delete: async (id: number, userId: number) => {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)
      .eq('uploaded_by', userId);

    if (error) {
      console.error('Error deleting resource:', error);
      return { changes: 0 };
    }

    return { changes: 1 };
  },

  /**
   * Get all categories
   */
  getCategories: async () => {
    const { data, error } = await supabase
      .from('resources')
      .select('category')
      .eq('is_approved', true)
      .order('category');

    if (error) {
      console.error('Error getting categories:', error);
      return [];
    }

    // Get unique categories
    const uniqueCategories = [...new Set(data.map((r: any) => r.category))];
    return uniqueCategories.map(category => ({ category }));
  }
};

// Export Supabase client for direct use if needed
export { supabase };
export default supabase;
