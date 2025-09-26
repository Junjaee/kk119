'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Association, AssociationMember, UserProfile } from '@/lib/types/user';

interface AssociationHook {
  associations: Association[];
  userMemberships: AssociationMember[];
  loading: boolean;
  error: string | null;

  // 협회 관리
  createAssociation: (data: Omit<Association, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error?: string }>;
  updateAssociation: (id: string, updates: Partial<Association>) => Promise<{ error?: string }>;
  deleteAssociation: (id: string) => Promise<{ error?: string }>;

  // 멤버십 관리
  joinAssociation: (associationId: string) => Promise<{ error?: string }>;
  leaveAssociation: (associationId: string) => Promise<{ error?: string }>;
  approveMembership: (membershipId: string) => Promise<{ error?: string }>;
  rejectMembership: (membershipId: string) => Promise<{ error?: string }>;
  setAssociationAdmin: (membershipId: string, isAdmin: boolean) => Promise<{ error?: string }>;

  // 조회 함수
  getAssociationMembers: (associationId: string) => Promise<(AssociationMember & { user_profile: UserProfile })[]>;
  getPendingMemberships: (associationId: string) => Promise<(AssociationMember & { user_profile: UserProfile })[]>;
  refreshData: () => Promise<void>;
}

export function useAssociations(userId?: string): AssociationHook {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [userMemberships, setUserMemberships] = useState<AssociationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 협회 목록 로드
      const { data: associationsData, error: associationsError } = await supabase
        .from('associations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (associationsError) {
        throw associationsError;
      }

      setAssociations(associationsData || []);

      // 사용자 멤버십 로드 (userId가 있는 경우)
      if (userId) {
        const { data: membershipsData, error: membershipsError } = await supabase
          .from('association_members')
          .select('*')
          .eq('user_id', userId)
          .order('joined_at', { ascending: false });

        if (membershipsError) {
          throw membershipsError;
        }

        setUserMemberships(membershipsData || []);
      }
    } catch (err: any) {
      console.error('Error loading associations data:', err);
      setError(err.message || '데이터 로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 협회 생성
  const createAssociation = useCallback(async (data: Omit<Association, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('associations')
        .insert({
          ...data,
          is_active: true,
        });

      if (error) {
        return { error: error.message };
      }

      await loadData();
      return {};
    } catch (err: any) {
      return { error: err.message || '협회 생성에 실패했습니다.' };
    }
  }, [supabase, loadData]);

  // 협회 업데이트
  const updateAssociation = useCallback(async (id: string, updates: Partial<Association>) => {
    try {
      const { error } = await supabase
        .from('associations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      await loadData();
      return {};
    } catch (err: any) {
      return { error: err.message || '협회 업데이트에 실패했습니다.' };
    }
  }, [supabase, loadData]);

  // 협회 삭제 (비활성화)
  const deleteAssociation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('associations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      await loadData();
      return {};
    } catch (err: any) {
      return { error: err.message || '협회 삭제에 실패했습니다.' };
    }
  }, [supabase, loadData]);

  // 협회 가입 신청
  const joinAssociation = useCallback(async (associationId: string) => {
    if (!userId) {
      return { error: '로그인이 필요합니다.' };
    }

    try {
      const { error } = await supabase
        .from('association_members')
        .insert({
          user_id: userId,
          association_id: associationId,
          is_admin: false,
          is_active: true,
        });

      if (error) {
        return { error: error.message };
      }

      await loadData();
      return {};
    } catch (err: any) {
      return { error: err.message || '협회 가입 신청에 실패했습니다.' };
    }
  }, [userId, supabase, loadData]);

  // 협회 탈퇴
  const leaveAssociation = useCallback(async (associationId: string) => {
    if (!userId) {
      return { error: '로그인이 필요합니다.' };
    }

    try {
      const { error } = await supabase
        .from('association_members')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('association_id', associationId);

      if (error) {
        return { error: error.message };
      }

      await loadData();
      return {};
    } catch (err: any) {
      return { error: err.message || '협회 탈퇴에 실패했습니다.' };
    }
  }, [userId, supabase, loadData]);

  // 멤버십 승인
  const approveMembership = useCallback(async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from('association_members')
        .update({
          approved_at: new Date().toISOString(),
          approved_by: userId,
        })
        .eq('id', membershipId);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      return { error: err.message || '멤버십 승인에 실패했습니다.' };
    }
  }, [userId, supabase]);

  // 멤버십 거부
  const rejectMembership = useCallback(async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from('association_members')
        .update({ is_active: false })
        .eq('id', membershipId);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      return { error: err.message || '멤버십 거부에 실패했습니다.' };
    }
  }, [supabase]);

  // 협회 관리자 권한 설정
  const setAssociationAdmin = useCallback(async (membershipId: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('association_members')
        .update({ is_admin: isAdmin })
        .eq('id', membershipId);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      return { error: err.message || '관리자 권한 설정에 실패했습니다.' };
    }
  }, [supabase]);

  // 협회 멤버 조회
  const getAssociationMembers = useCallback(async (associationId: string) => {
    try {
      const { data, error } = await supabase
        .from('association_members')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('association_id', associationId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err: any) {
      console.error('Error loading association members:', err);
      return [];
    }
  }, [supabase]);

  // 대기 중인 멤버십 조회
  const getPendingMemberships = useCallback(async (associationId: string) => {
    try {
      const { data, error } = await supabase
        .from('association_members')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('association_id', associationId)
        .eq('is_active', true)
        .is('approved_at', null)
        .order('joined_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err: any) {
      console.error('Error loading pending memberships:', err);
      return [];
    }
  }, [supabase]);

  return {
    associations,
    userMemberships,
    loading,
    error,
    createAssociation,
    updateAssociation,
    deleteAssociation,
    joinAssociation,
    leaveAssociation,
    approveMembership,
    rejectMembership,
    setAssociationAdmin,
    getAssociationMembers,
    getPendingMemberships,
    refreshData: loadData,
  };
}