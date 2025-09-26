'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Check,
  X,
  Info,
  Eye,
  Edit,
  Trash2,
  Plus,
  Settings,
  Users,
  FileText,
  Scale,
  Building2,
  BarChart3,
  Lock
} from 'lucide-react';
import {
  UserRole,
  ResourceType,
  ActionType,
  Permission,
  rolePermissions,
  roleDisplayNames,
  roleColors
} from '@/lib/types/user';

interface PermissionMatrixProps {
  selectedRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  interactive?: boolean;
}

// 리소스 정보 매핑
const resourceInfo: Record<ResourceType, { icon: any; label: string; description: string }> = {
  reports: {
    icon: FileText,
    label: '신고 접수',
    description: '교권 침해 신고 및 사건 관리'
  },
  community_posts: {
    icon: Users,
    label: '커뮤니티',
    description: '커뮤니티 게시글 및 댓글'
  },
  consultation_posts: {
    icon: Scale,
    label: '법적 상담',
    description: '변호사 상담 및 법적 조언'
  },
  users: {
    icon: Users,
    label: '사용자 관리',
    description: '사용자 계정 및 프로필 관리'
  },
  associations: {
    icon: Building2,
    label: '협회 관리',
    description: '교원 단체 및 협회 관리'
  },
  system_settings: {
    icon: Settings,
    label: '시스템 설정',
    description: '시스템 환경 설정 및 구성'
  },
  analytics: {
    icon: BarChart3,
    label: '분석 통계',
    description: '시스템 사용 통계 및 분석'
  }
};

// 액션 정보 매핑
const actionInfo: Record<ActionType, { icon: any; label: string; color: string }> = {
  create: { icon: Plus, label: '생성', color: 'text-green-600' },
  read: { icon: Eye, label: '조회', color: 'text-blue-600' },
  update: { icon: Edit, label: '수정', color: 'text-yellow-600' },
  delete: { icon: Trash2, label: '삭제', color: 'text-red-600' },
  manage: { icon: Shield, label: '관리', color: 'text-purple-600' }
};

// 스코프 정보 매핑
const scopeInfo = {
  own: { label: '본인만', color: 'bg-blue-100 text-blue-800', description: '자신이 생성한 리소스만' },
  association: { label: '협회내', color: 'bg-green-100 text-green-800', description: '소속 협회 내 리소스' },
  all: { label: '전체', color: 'bg-purple-100 text-purple-800', description: '모든 리소스' }
};

export function PermissionMatrix({ selectedRole, onRoleChange, interactive = true }: PermissionMatrixProps) {
  const [currentRole, setCurrentRole] = useState<UserRole>(selectedRole || 'teacher');

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    onRoleChange?.(role);
  };

  // 현재 역할의 권한 목록
  const currentPermissions = useMemo(() => {
    return rolePermissions[currentRole] || [];
  }, [currentRole]);

  // 권한 매트릭스 생성
  const permissionMatrix = useMemo(() => {
    const resources = Object.keys(resourceInfo) as ResourceType[];
    const actions = Object.keys(actionInfo) as ActionType[];

    return resources.map(resource => {
      const resourcePerms = currentPermissions.filter(p => p.resource === resource);

      return {
        resource,
        permissions: actions.map(action => {
          const permission = resourcePerms.find(p =>
            p.action === action || p.action === 'manage'
          );
          return {
            action,
            granted: !!permission,
            permission
          };
        })
      };
    });
  }, [currentPermissions]);

  // 권한 통계
  const permissionStats = useMemo(() => {
    const total = Object.keys(resourceInfo).length * Object.keys(actionInfo).length;
    const granted = permissionMatrix.reduce((acc, resource) =>
      acc + resource.permissions.filter(p => p.granted).length, 0
    );

    return {
      total,
      granted,
      percentage: Math.round((granted / total) * 100)
    };
  }, [permissionMatrix]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lock className="h-6 w-6" />
            권한 매트릭스
          </h2>
          <p className="text-muted-foreground">역할별 시스템 권한을 확인합니다</p>
        </div>

        {interactive && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">역할 선택:</div>
            <Select value={currentRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleDisplayNames).map(([role, name]) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      <Badge className={roleColors[role as UserRole]} variant="outline">
                        {name}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* 권한 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className={roleColors[currentRole]} variant="outline">
              {roleDisplayNames[currentRole]}
            </Badge>
            권한 현황
          </CardTitle>
          <CardDescription>
            현재 역할에 부여된 권한의 통계입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{permissionStats.granted}</div>
              <div className="text-sm text-muted-foreground">허용된 권한</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{permissionStats.total}</div>
              <div className="text-sm text-muted-foreground">전체 권한</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{permissionStats.percentage}%</div>
              <div className="text-sm text-muted-foreground">권한 비율</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 권한 매트릭스 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>세부 권한 매트릭스</CardTitle>
          <CardDescription>
            리소스별 액션에 대한 상세 권한 정보입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">리소스</TableHead>
                {Object.entries(actionInfo).map(([action, info]) => (
                  <TableHead key={action} className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <info.icon className={`h-4 w-4 ${info.color}`} />
                      <span className="text-xs">{info.label}</span>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center">권한 레벨</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionMatrix.map(({ resource, permissions }) => {
                const ResourceIcon = resourceInfo[resource].icon;
                return (
                  <TableRow key={resource}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ResourceIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{resourceInfo[resource].label}</div>
                          <div className="text-xs text-muted-foreground">
                            {resourceInfo[resource].description}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {permissions.map(({ action, granted, permission }) => (
                      <TableCell key={action} className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {granted ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              {permission && (
                                <Badge className={scopeInfo[permission.scope].color} variant="outline">
                                  {scopeInfo[permission.scope].label}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <X className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                      </TableCell>
                    ))}

                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1">
                        {permissions
                          .filter(p => p.granted && p.permission)
                          .map(({ permission }, idx) => (
                            <Badge
                              key={idx}
                              className={scopeInfo[permission!.scope].color}
                              variant="outline"
                              title={scopeInfo[permission!.scope].description}
                            >
                              {scopeInfo[permission!.scope].label}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 권한 범례 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            권한 범례
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 액션 범례 */}
            <div>
              <h4 className="font-medium mb-2">액션 유형</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(actionInfo).map(([action, info]) => (
                  <div key={action} className="flex items-center gap-2">
                    <info.icon className={`h-4 w-4 ${info.color}`} />
                    <span className="text-sm">{info.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 스코프 범례 */}
            <div>
              <h4 className="font-medium mb-2">권한 범위</h4>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(scopeInfo).map(([scope, info]) => (
                  <div key={scope} className="flex items-center gap-2">
                    <Badge className={info.color} variant="outline">
                      {info.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{info.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 역할 범례 */}
            <div>
              <h4 className="font-medium mb-2">사용자 역할</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(roleDisplayNames).map(([role, name]) => (
                  <Badge key={role} className={roleColors[role as UserRole]} variant="outline">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}