'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  MapPin,
  Globe,
  BarChart3,
  ArrowRightLeft,
  Settings,
  Crown,
  Activity,
  TrendingUp
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { roleDisplayNames, roleColors } from '@/lib/types/user';

export function AssociationManager() {
  const { user: profile } = useStore();

  // Mock data for demo purposes
  const [associations, setAssociations] = useState([
    {
      id: '1',
      name: '전국교육공무원노동조합',
      description: '전국 교육공무원들의 권익 보호와 교육 발전을 위한 단체',
      contact_email: 'contact@ktu.or.kr',
      contact_phone: '02-570-5000',
      website: 'https://ktu.or.kr',
      address: '서울시 서초구 방배로 42길 11',
      created_at: '2023-01-15'
    },
    {
      id: '2',
      name: '한국교원단체총연합회',
      description: '교원의 지위 향상과 교육 발전을 목표로 하는 교원단체',
      contact_email: 'info@kfta.or.kr',
      contact_phone: '02-570-8000',
      website: 'https://kfta.or.kr',
      address: '서울시 서초구 태헤란로 4길 37',
      created_at: '2023-02-20'
    }
  ]);

  const [userMemberships, setUserMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedAssociation, setSelectedAssociation] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [showMoveUserDialog, setShowMoveUserDialog] = useState(false);
  const [showBulkAdminDialog, setShowBulkAdminDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Association>>({});
  const [members, setMembers] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [associationStats, setAssociationStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [targetAssociation, setTargetAssociation] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mock handlers
  const loadAssociationMembers = async (associationId: string) => {
    setActionLoading('loading-members');
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock data
    setMembers([
      {
        id: '1',
        user_profile: {
          name: '김교사',
          email: 'teacher1@school.edu',
          role: 'teacher'
        },
        is_admin: false,
        joined_at: '2023-03-01'
      },
      {
        id: '2',
        user_profile: {
          name: '박교사',
          email: 'teacher2@school.edu',
          role: 'teacher'
        },
        is_admin: true,
        joined_at: '2023-02-15'
      }
    ]);
    setPendingMembers([]);
    setActionLoading(null);
  };

  // Mock stats
  const loadAssociationStats = async (associationId: string) => {
    setActionLoading('loading-stats');
    await new Promise(resolve => setTimeout(resolve, 300));

    setAssociationStats({
      totalMembers: 156,
      activeMembers: 142,
      pendingMembers: 5,
      monthlyGrowth: '+12%',
      avgActivityScore: 85
    });
    setActionLoading(null);
  };

  // Mock users
  const loadAllUsers = async () => {
    setActionLoading('loading-users');
    await new Promise(resolve => setTimeout(resolve, 300));

    setAllUsers([
      { id: '1', name: '이교사', email: 'lee@school.edu', role: 'teacher' },
      { id: '2', name: '최교사', email: 'choi@school.edu', role: 'teacher' }
    ]);
    setActionLoading(null);
  };

  // 일괄 관리자 설정
  const handleBulkSetAdmin = async (membershipIds: string[], isAdmin: boolean) => {
    try {
      setActionLoading('bulk-admin');
      const response = await fetch('/api/admin/associations/bulk-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipIds, isAdmin }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '일괄 관리자 설정에 실패했습니다.');
      }

      setMessage({ type: 'success', text: `${membershipIds.length}명의 관리자 권한이 ${isAdmin ? '부여' : '해제'}되었습니다.` });
      if (selectedAssociation) {
        loadAssociationMembers(selectedAssociation.id);
      }
    } catch (err) {
      console.error('Error bulk setting admin:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.' });
    } finally {
      setActionLoading(null);
    }
  };

  // 사용자 협회 이동
  const handleMoveUsers = async (userIds: string[], fromAssociationId: string, toAssociationId: string) => {
    try {
      setActionLoading('moving-users');
      const response = await fetch('/api/admin/associations/move-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, fromAssociationId, toAssociationId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '사용자 이동에 실패했습니다.');
      }

      setMessage({ type: 'success', text: `${userIds.length}명의 사용자가 이동되었습니다.` });
      setSelectedUsers([]);
      setShowMoveUserDialog(false);
      refreshData();
    } catch (err) {
      console.error('Error moving users:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Mock handlers for CRUD operations
  const handleCreateAssociation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setActionLoading('creating');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Add to mock data
    const newAssociation = {
      id: String(associations.length + 1),
      ...formData,
      created_at: new Date().toISOString()
    };
    setAssociations([...associations, newAssociation]);

    setMessage({ type: 'success', text: '협회가 성공적으로 생성되었습니다.' });
    setShowCreateDialog(false);
    setFormData({});
    setActionLoading(null);
  };

  const handleUpdateAssociation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssociation || !formData.name) return;

    setActionLoading('updating');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update mock data
    setAssociations(associations.map(a =>
      a.id === selectedAssociation.id ? { ...a, ...formData } : a
    ));

    setMessage({ type: 'success', text: '협회 정보가 업데이트되었습니다.' });
    setShowEditDialog(false);
    setFormData({});
    setSelectedAssociation(null);
    setActionLoading(null);
  };

  const handleDeleteAssociation = async (association: any) => {
    if (!confirm(`정말로 "${association.name}" 협회를 삭제하시겠습니까?`)) return;

    setActionLoading(`deleting-${association.id}`);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Remove from mock data
    setAssociations(associations.filter(a => a.id !== association.id));

    setMessage({ type: 'success', text: '협회가 삭제되었습니다.' });
    setActionLoading(null);
  };

  // Mock membership handlers
  const handleApproveMembership = async (membershipId: string) => {
    setActionLoading(`approving-${membershipId}`);
    await new Promise(resolve => setTimeout(resolve, 300));

    setMessage({ type: 'success', text: '멤버십이 승인되었습니다.' });
    // Remove from pending and add to members
    setPendingMembers(pendingMembers.filter((m: any) => m.id !== membershipId));
    setActionLoading(null);
  };

  const handleRejectMembership = async (membershipId: string) => {
    setActionLoading(`rejecting-${membershipId}`);
    await new Promise(resolve => setTimeout(resolve, 300));

    setMessage({ type: 'success', text: '멤버십이 거부되었습니다.' });
    setPendingMembers(pendingMembers.filter((m: any) => m.id !== membershipId));
    setActionLoading(null);
  };

  const handleToggleAdmin = async (membershipId: string, currentIsAdmin: boolean) => {
    setActionLoading(`admin-${membershipId}`);
    await new Promise(resolve => setTimeout(resolve, 300));

    setMessage({
      type: 'success',
      text: `관리자 권한이 ${!currentIsAdmin ? '부여' : '해제'}되었습니다.`
    });

    // Update member admin status in mock data
    setMembers(members.map((m: any) =>
      m.id === membershipId ? { ...m, is_admin: !currentIsAdmin } : m
    ));
    setActionLoading(null);
  };

  // 권한 체크
  const canManageAssociations = profile?.role === 'super_admin';
  const canManageMembers = (associationId: string) => {
    if (profile?.role === 'super_admin') return true;
    return userMemberships.some(m =>
      m.association_id === associationId && m.is_admin && m.is_active
    );
  };

  return (
    <div className="space-y-6">
      {/* 메시지 알림 */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            협회 관리
          </h2>
          <p className="text-muted-foreground">교원 단체 및 협회를 관리합니다</p>
        </div>

        <div className="flex gap-2">
          {canManageAssociations && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  loadAllUsers();
                  setShowMoveUserDialog(true);
                }}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                사용자 이동
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    협회 추가
                  </Button>
                </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 협회 생성</DialogTitle>
                <DialogDescription>
                  새로운 교원 단체 또는 협회를 생성합니다.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAssociation} className="space-y-4">
                <div>
                  <Label htmlFor="name">협회명 *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_email">이메일</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email || ''}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">전화번호</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone || ''}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website">웹사이트</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">주소</Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    취소
                  </Button>
                  <Button type="submit" disabled={actionLoading === 'creating'}>
                    {actionLoading === 'creating' ? '생성 중...' : '생성'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
            </>
          )}
        </div>
      </div>

      {/* 협회 목록 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">협회 정보를 불러오는 중...</p>
          </div>
        ) : associations.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">등록된 협회가 없습니다.</p>
          </div>
        ) : (
          associations.map((association) => (
            <Card key={association.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{association.name}</CardTitle>
                  <div className="flex gap-1">
                    {canManageAssociations && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAssociation(association);
                            setFormData(association);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAssociation(association)}
                          disabled={actionLoading === `deleting-${association.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {association.description && (
                  <CardDescription>{association.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {association.contact_email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {association.contact_email}
                  </div>
                )}
                {association.contact_phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {association.contact_phone}
                  </div>
                )}
                {association.website && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <a
                      href={association.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      웹사이트
                    </a>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">
                      {userMemberships.filter(m => m.association_id === association.id && m.is_active).length > 0 ? '가입됨' : '미가입'}
                    </Badge>
                    {canManageAssociations && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedAssociation(association);
                          setShowStatsDialog(true);
                          loadAssociationStats(association.id);
                        }}
                      >
                        <BarChart3 className="h-3 w-3 mr-1" />
                        통계
                      </Button>
                    )}
                  </div>

                  {canManageMembers(association.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAssociation(association);
                        setShowMembersDialog(true);
                        loadAssociationMembers(association.id);
                      }}
                      className="w-full"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      멤버 관리
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 협회 수정 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>협회 정보 수정</DialogTitle>
            <DialogDescription>
              협회 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAssociation} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">협회명 *</Label>
              <Input
                id="edit-name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">설명</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-contact_email">이메일</Label>
                <Input
                  id="edit-contact_email"
                  type="email"
                  value={formData.contact_email || ''}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-contact_phone">전화번호</Label>
                <Input
                  id="edit-contact_phone"
                  value={formData.contact_phone || ''}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-website">웹사이트</Label>
              <Input
                id="edit-website"
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-address">주소</Label>
              <Input
                id="edit-address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                취소
              </Button>
              <Button type="submit" disabled={actionLoading === 'updating'}>
                {actionLoading === 'updating' ? '수정 중...' : '수정'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 멤버 관리 다이얼로그 */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAssociation?.name} 멤버 관리
            </DialogTitle>
            <DialogDescription>
              협회 멤버를 관리하고 권한을 설정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 일괄 관리 버튼 */}
            {profile?.role === 'super_admin' && members.length > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const selectedMemberIds = members.filter(m => selectedUsers.includes(m.id)).map(m => m.id);
                      if (selectedMemberIds.length === 0) {
                        setMessage({ type: 'error', text: '멤버를 선택해주세요.' });
                        return;
                      }
                      handleBulkSetAdmin(selectedMemberIds, true);
                    }}
                    disabled={selectedUsers.length === 0}
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    선택한 멤버 관리자 권한 부여
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const selectedMemberIds = members.filter(m => selectedUsers.includes(m.id)).map(m => m.id);
                      if (selectedMemberIds.length === 0) {
                        setMessage({ type: 'error', text: '멤버를 선택해주세요.' });
                        return;
                      }
                      handleBulkSetAdmin(selectedMemberIds, false);
                    }}
                    disabled={selectedUsers.length === 0}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    선택한 멤버 관리자 권한 해제
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedUsers.length}명 선택됨
                </p>
              </div>
            )}

            {/* 승인 대기 멤버 */}
            {pendingMembers.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">승인 대기 ({pendingMembers.length})</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead>신청일</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingMembers.map((member: any) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.user_profile?.name}</TableCell>
                        <TableCell>{member.user_profile?.email}</TableCell>
                        <TableCell>
                          <Badge className={roleColors[member.user_profile?.role as keyof typeof roleColors]}>
                            {roleDisplayNames[member.user_profile?.role as keyof typeof roleDisplayNames]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(member.joined_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleApproveMembership(member.id)}
                              disabled={actionLoading === `approving-${member.id}`}
                            >
                              <UserCheck className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectMembership(member.id)}
                              disabled={actionLoading === `rejecting-${member.id}`}
                            >
                              <UserX className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 활성 멤버 */}
            <div>
              <h4 className="font-semibold mb-3">활성 멤버 ({members.length})</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    {profile?.role === 'super_admin' && <TableHead className="w-12">선택</TableHead>}
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead>권한</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member: any) => (
                    <TableRow key={member.id}>
                      {profile?.role === 'super_admin' && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(member.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, member.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== member.id));
                              }
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </TableCell>
                      )}
                      <TableCell>{member.user_profile?.name}</TableCell>
                      <TableCell>{member.user_profile?.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[member.user_profile?.role as keyof typeof roleColors]}>
                          {roleDisplayNames[member.user_profile?.role as keyof typeof roleDisplayNames]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.joined_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        {member.is_admin && (
                          <Badge variant="secondary">
                            <Shield className="h-3 w-3 mr-1" />
                            관리자
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {profile?.role === 'super_admin' && (
                          <Button
                            size="sm"
                            variant={member.is_admin ? 'default' : 'outline'}
                            onClick={() => handleToggleAdmin(member.id, member.is_admin)}
                            disabled={actionLoading === `admin-${member.id}`}
                          >
                            <Shield className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}