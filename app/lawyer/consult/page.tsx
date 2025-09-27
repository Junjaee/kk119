'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/date';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface ConsultItem {
  id: number;
  report_id?: number;
  title: string;
  report_type: string;
  status: string;
  incident_date: string;
  report_content: string;
  consult_content?: string;
  created_at: string;
  updated_at: string;
  answered_at?: string;
  claimed_at?: string;
  user_nickname?: string;
  lawyer_name?: string;
  reply_count?: number;
}

export default function ConsultListPage() {
  const router = useRouter();
  const { user } = useStore();

  const [consults, setConsults] = useState<ConsultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchConsults();
  }, []);

  const fetchConsults = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setRefreshing(true);

    try {
      // Using the existing API endpoint
      const response = await fetch('/api/lawyer/my-cases?lawyer_id=1');
      const data = await response.json();

      if (data.success) {
        setConsults(data.data || []);
      } else {
        toast.error('상담 목록을 불러오는데 실패했습니다');
      }
    } catch (error) {
      console.error('Error fetching consults:', error);
      toast.error('상담 목록을 불러오는 중 오류가 발생했습니다');
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">대기중</Badge>;
      case 'reviewing':
        return <Badge variant="warning" className="bg-yellow-100 text-yellow-700">검토중</Badge>;
      case 'answered':
        return <Badge className="bg-green-100 text-green-700">답변완료</Badge>;
      case 'follow_up':
        return <Badge className="bg-orange-100 text-orange-700">추가답변</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700">종료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'reviewing':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'answered':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'follow_up':
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredConsults = consults.filter(consult => {
    const matchesSearch = consult.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consult.report_content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || consult.status === statusFilter;
    const matchesType = typeFilter === 'all' || consult.report_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleConsultClick = (consult: ConsultItem) => {
    // Navigate to individual consult page - we need to create UUID or use ID
    router.push(`/lawyer/consult/${consult.id}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">상담 목록을 불러오는 중...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">상담 관리</h1>
            <p className="text-muted-foreground mt-1">
              배정받은 법률 상담을 관리하고 답변을 작성하세요
            </p>
          </div>
          <Button
            onClick={() => fetchConsults(false)}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              필터 및 검색
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">검색</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="제목 또는 내용으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">상태</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="pending">대기중</SelectItem>
                    <SelectItem value="reviewing">검토중</SelectItem>
                    <SelectItem value="answered">답변완료</SelectItem>
                    <SelectItem value="follow_up">추가답변</SelectItem>
                    <SelectItem value="completed">종료</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">유형</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="verbal">학부모 민원</SelectItem>
                    <SelectItem value="violence">학생 폭력</SelectItem>
                    <SelectItem value="sexual">욕설 및 폭언</SelectItem>
                    <SelectItem value="defamation">명예훼손</SelectItem>
                    <SelectItem value="harassment">성희롱</SelectItem>
                    <SelectItem value="threat">협박</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">전체 상담</p>
                  <p className="text-2xl font-bold">{consults.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">대기중</p>
                  <p className="text-2xl font-bold">
                    {consults.filter(c => c.status === 'pending' || c.status === 'reviewing').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">답변완료</p>
                  <p className="text-2xl font-bold">
                    {consults.filter(c => c.status === 'answered' || c.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">추가답변</p>
                  <p className="text-2xl font-bold">
                    {consults.filter(c => c.status === 'follow_up').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consult List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>상담 목록</span>
              <span className="text-sm font-normal text-muted-foreground">
                {filteredConsults.length}개의 상담
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredConsults.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">상담이 없습니다</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? '검색 조건에 맞는 상담이 없습니다'
                    : '아직 배정받은 상담이 없습니다'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredConsults.map((consult) => (
                  <div
                    key={consult.id}
                    onClick={() => handleConsultClick(consult)}
                    className="border rounded-lg p-6 hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="mt-1">
                          {getStatusIcon(consult.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                              {consult.title}
                            </h3>
                            {getStatusBadge(consult.status)}
                            <Badge variant="outline">
                              {getTypeLabel(consult.report_type)}
                            </Badge>
                          </div>

                          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                            {consult.report_content}
                          </p>

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {consult.user_nickname || '교사'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              사건일시: {formatDateTime(consult.incident_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              접수: {formatRelativeTime(consult.created_at)}
                            </span>
                            {consult.answered_at && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                답변: {formatRelativeTime(consult.answered_at)}
                              </span>
                            )}
                            {consult.reply_count && consult.reply_count > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {consult.reply_count}개 대화
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}