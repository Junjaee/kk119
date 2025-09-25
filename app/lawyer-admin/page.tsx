'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  UserCheck,
  Calendar,
  ArrowRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { useStore } from '@/lib/store';
import { switchUser } from '@/lib/auth/mock-auth';
import toast from 'react-hot-toast';

interface Consult {
  id: number;
  title: string;
  report_type: string;
  incident_date: string;
  created_at: string;
  user_nickname: string;
  report_content: string;
}

interface Lawyer {
  id: number;
  name: string;
  specialty: string;
  years_of_experience: number;
}

interface Stats {
  total: number;
  pending: number;
  assigned: number;
}

export default function LawyerAdminDashboard() {
  const { user, setUser } = useStore();
  const [unassignedConsults, setUnassignedConsults] = useState<Consult[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, assigned: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedConsult, setSelectedConsult] = useState<Consult | null>(null);
  const [selectedLawyer, setSelectedLawyer] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  // Switch to lawyer_admin user for testing
  useEffect(() => {
    if (user?.role !== 'lawyer_admin') {
      const lawyerAdminUser = switchUser('lawyer_admin');
      setUser(lawyerAdminUser);
    }
  }, [user?.role, setUser]);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch unassigned consults
      const consultsResponse = await fetch('/api/consult/unassigned');
      const consultsData = await consultsResponse.json();

      if (consultsData.success) {
        setUnassignedConsults(consultsData.data.consults);
        setStats(consultsData.data.stats);
      }

      // Fetch lawyers
      const lawyersResponse = await fetch('/api/lawyers');
      const lawyersData = await lawyersResponse.json();

      if (lawyersData.success) {
        setLawyers(lawyersData.data);
      }

    } catch (error) {
      console.error('Data fetch error:', error);
      toast.error('데이터를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLawyer = async () => {
    if (!selectedConsult || !selectedLawyer) {
      toast.error('상담과 변호사를 모두 선택해주세요');
      return;
    }

    setAssigning(true);
    try {
      const response = await fetch('/api/consult/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultId: selectedConsult.id,
          lawyerId: parseInt(selectedLawyer)
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('변호사가 성공적으로 배정되었습니다');
        setSelectedConsult(null);
        setSelectedLawyer('');
        fetchData(); // Refresh data
      } else {
        toast.error(data.error || '배정 중 오류가 발생했습니다');
      }

    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('배정 중 오류가 발생했습니다');
    } finally {
      setAssigning(false);
    }
  };


  const getTypeLabel = (type: string) => {
    const types = {
      verbal: '학부모 민원',
      violence: '학생 폭력',
      sexual: '욕설 및 폭언',
      defamation: '명예훼손',
      harassment: '성희롱',
      threat: '협박',
      other: '기타'
    };
    return types[type as keyof typeof types] || type;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>데이터를 불러오는 중...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">변호사 관리 대시보드</h1>
          <p className="text-muted-foreground mt-2">
            상담을 변호사들에게 배정하고 관리하세요
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 대기</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                배정 대기 중인 상담
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">대기중</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                배정 대기
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">배정 완료</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
              <p className="text-xs text-muted-foreground">
                오늘 배정
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">등록 변호사</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lawyers.length}</div>
              <p className="text-xs text-muted-foreground">
                배정 가능한 변호사
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Unassigned Consults */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                배정 대기 상담
                <Badge variant="outline">{unassignedConsults.length}</Badge>
              </CardTitle>
              <CardDescription>
                변호사 배정이 필요한 상담 목록
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {unassignedConsults.map((consult) => (
                <div
                  key={consult.id}
                  className={`p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer ${
                    selectedConsult?.id === consult.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedConsult(consult)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold line-clamp-1">{consult.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {consult.report_content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {consult.user_nickname}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(consult.incident_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{getTypeLabel(consult.report_type)}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(consult.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {unassignedConsults.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    모든 상담이 배정되었습니다
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>변호사 배정</CardTitle>
              <CardDescription>
                선택한 상담을 변호사에게 배정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedConsult ? (
                <>
                  {/* Selected Consult Info */}
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <h4 className="font-semibold mb-2">선택된 상담</h4>
                    <p className="text-sm mb-2">{selectedConsult.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{selectedConsult.user_nickname}</span>
                      <span>•</span>
                      <span>{getTypeLabel(selectedConsult.report_type)}</span>
                    </div>
                  </div>

                  {/* Lawyer Selection */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">변호사 선택</h4>
                    <Select value={selectedLawyer} onValueChange={setSelectedLawyer}>
                      <SelectTrigger>
                        <SelectValue placeholder="변호사를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {lawyers.map((lawyer) => (
                          <SelectItem key={lawyer.id} value={lawyer.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{lawyer.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {lawyer.specialty} • {lawyer.years_of_experience}년 경력
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignment Button */}
                  <Button
                    onClick={handleAssignLawyer}
                    disabled={!selectedLawyer || assigning}
                    className="w-full"
                    size="lg"
                  >
                    {assigning ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        배정 중...
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        변호사 배정하기
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <ArrowRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    왼쪽에서 상담을 선택하세요
                  </p>
                </div>
              )}

              {/* Lawyers List */}
              <div className="space-y-4">
                <h4 className="font-semibold">등록된 변호사</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {lawyers.map((lawyer) => (
                    <div key={lawyer.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{lawyer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {lawyer.specialty}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {lawyer.years_of_experience}년
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}