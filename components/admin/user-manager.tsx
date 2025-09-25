'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Shield,
  GraduationCap,
  Scale,
  UserCheck,
  UserX,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { UserProfile, UserRole, roleDisplayNames, roleColors } from '@/lib/types/user';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface UserManagerProps {
  className?: string;
}

interface UsersResponse {
  users: UserProfile[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function UserManager({ className }: UserManagerProps) {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 권한 확인
  const canManageUsers = profile?.role === 'super_admin';

  // 사용자 목록 불러오기
  const fetchUsers = async (page = 1) => {
    if (!canManageUsers) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      const data: UsersResponse = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setTotalCount(data.totalCount);
        setCurrentPage(data.currentPage);
      } else {
        toast.error(data.error || '사용자 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, searchTerm, canManageUsers]);

  // 사용자 생성
  const handleCreateUser = async (userData: any) => {
    if (!canManageUsers) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('사용자가 성공적으로 생성되었습니다.');
        setIsCreateDialogOpen(false);
        fetchUsers(currentPage);
      } else {
        toast.error(data.error || '사용자 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('사용자 생성에 실패했습니다.');
    }
  };

  // 사용자 수정
  const handleUpdateUser = async (userId: string, userData: any) => {
    if (!canManageUsers) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('사용자 정보가 수정되었습니다.');
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        fetchUsers(currentPage);
      } else {
        toast.error(data.error || '사용자 정보 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('사용자 정보 수정에 실패했습니다.');
    }
  };

  // 사용자 비활성화
  const handleDeactivateUser = async (userId: string, userName: string) => {
    if (!canManageUsers) return;

    if (!confirm(`${userName} 사용자를 비활성화하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('사용자가 비활성화되었습니다.');
        fetchUsers(currentPage);
      } else {
        toast.error(data.error || '사용자 비활성화에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      toast.error('사용자 비활성화에 실패했습니다.');
    }
  };

  // 역할 아이콘
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="h-4 w-4" />;
      case 'admin':
        return <UserCheck className="h-4 w-4" />;
      case 'lawyer':
        return <Scale className="h-4 w-4" />;
      case 'teacher':
        return <GraduationCap className="h-4 w-4" />;
    }
  };

  if (!canManageUsers) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">접근 권한 없음</h3>
            <p className="text-muted-foreground">
              이 기능은 슈퍼어드민만 사용할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                사용자 관리
              </CardTitle>
              <CardDescription>
                시스템 사용자를 생성, 수정, 관리합니다.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                대량 생성
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    새 사용자
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>새 사용자 생성</DialogTitle>
                    <DialogDescription>
                      새로운 시스템 사용자를 생성합니다.
                    </DialogDescription>
                  </DialogHeader>
                  <UserForm onSubmit={handleCreateUser} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* 검색 및 필터 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="사용자 검색 (이름, 이메일)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="역할 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 역할</SelectItem>
                <SelectItem value="super_admin">최고관리자</SelectItem>
                <SelectItem value="admin">협회관리자</SelectItem>
                <SelectItem value="lawyer">변호사</SelectItem>
                <SelectItem value="teacher">교사</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 사용자 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {(['super_admin', 'admin', 'lawyer', 'teacher'] as UserRole[]).map((role) => {
              const count = users.filter(user => user.role === role).length;
              return (
                <Card key={role}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(role)}
                      <div>
                        <p className="text-sm font-medium">{roleDisplayNames[role]}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 사용자 테이블 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      사용자 목록을 불러오는 중...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      사용자가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.school_name && (
                            <p className="text-xs text-muted-foreground">{user.school_name}</p>
                          )}
                          {user.law_firm && (
                            <p className="text-xs text-muted-foreground">{user.law_firm}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]}>
                          <span className="mr-1">{getRoleIcon(user.role)}</span>
                          {roleDisplayNames[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.phone && <p>{user.phone}</p>}
                          {user.employee_id && <p>직원번호: {user.employee_id}</p>}
                          {user.license_number && <p>면허: {user.license_number}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={user.is_active ? 'success' : 'secondary'}>
                            {user.is_active ? '활성' : '비활성'}
                          </Badge>
                          <Badge variant={user.is_verified ? 'success' : 'destructive'}>
                            {user.is_verified ? '승인' : '미승인'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivateUser(user.id, user.name)}
                            disabled={user.id === profile?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          {totalCount > 20 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => fetchUsers(currentPage - 1)}
                disabled={currentPage === 1}
              >
                이전
              </Button>
              <span className="flex items-center px-4 text-sm">
                {currentPage} / {Math.ceil(totalCount / 20)}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchUsers(currentPage + 1)}
                disabled={currentPage === Math.ceil(totalCount / 20)}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>사용자 정보 수정</DialogTitle>
            <DialogDescription>
              선택한 사용자의 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              initialData={selectedUser}
              onSubmit={(data) => handleUpdateUser(selectedUser.id, data)}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 사용자 폼 컴포넌트
interface UserFormProps {
  initialData?: UserProfile;
  onSubmit: (data: any) => void;
  isEditing?: boolean;
}

function UserForm({ initialData, onSubmit, isEditing = false }: UserFormProps) {
  const [formData, setFormData] = useState({
    email: initialData?.email || '',
    password: '',
    name: initialData?.name || '',
    role: initialData?.role || 'teacher' as UserRole,
    phone: initialData?.phone || '',
    school_name: initialData?.school_name || '',
    employee_id: initialData?.employee_id || '',
    license_number: initialData?.license_number || '',
    law_firm: initialData?.law_firm || '',
    specialization: initialData?.specialization || '',
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    is_verified: initialData?.is_verified !== undefined ? initialData.is_verified : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">기본 정보</TabsTrigger>
          <TabsTrigger value="role">역할별 정보</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
                disabled={isEditing}
              />
            </div>
            {!isEditing && (
              <div>
                <Label htmlFor="password">비밀번호 *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="role">역할 *</Label>
              <Select value={formData.role} onValueChange={(value) => updateField('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">최고관리자</SelectItem>
                  <SelectItem value="admin">협회관리자</SelectItem>
                  <SelectItem value="lawyer">변호사</SelectItem>
                  <SelectItem value="teacher">교사</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>
        </TabsContent>

        <TabsContent value="role" className="space-y-4">
          {formData.role === 'teacher' && (
            <>
              <div>
                <Label htmlFor="school_name">학교명 *</Label>
                <Input
                  id="school_name"
                  value={formData.school_name}
                  onChange={(e) => updateField('school_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="employee_id">직원번호</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => updateField('employee_id', e.target.value)}
                />
              </div>
            </>
          )}

          {formData.role === 'lawyer' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="license_number">변호사 면허번호 *</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => updateField('license_number', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="law_firm">소속 로펌</Label>
                  <Input
                    id="law_firm"
                    value={formData.law_firm}
                    onChange={(e) => updateField('law_firm', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="specialization">전문분야 *</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => updateField('specialization', e.target.value)}
                  placeholder="예: 교육법, 학교폭력, 민사소송"
                  required
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => updateField('is_active', e.target.checked)}
            />
            <Label htmlFor="is_active">계정 활성화</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_verified"
              checked={formData.is_verified}
              onChange={(e) => updateField('is_verified', e.target.checked)}
            />
            <Label htmlFor="is_verified">계정 승인</Label>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="submit">
          {isEditing ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  );
}