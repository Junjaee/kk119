'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Send,
  Activity
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { roleDisplayNames } from '@/lib/types/user';

interface NotificationStats {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  avg_delivery_time: number;
  channel_breakdown: Record<string, number>;
}

interface NotificationLog {
  id: string;
  request_id: string;
  recipient_id: string;
  channel: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'expired';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

export default function NotificationManagementPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDays, setSelectedDays] = useState('7');

  // 권한 확인
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">접근 권한 없음</h2>
                <p className="text-muted-foreground mb-4">
                  이 페이지는 관리자만 접근할 수 있습니다.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm">현재 권한:</span>
                  <Badge>{roleDisplayNames[profile?.role || 'teacher']}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Load notification data
  useEffect(() => {
    loadNotificationData();
  }, [selectedDays]);

  // Filter logs
  useEffect(() => {
    let filtered = logs.filter(log => {
      const matchesSearch = log.recipient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.error_message?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesChannel = filterChannel === 'all' || log.channel === filterChannel;
      const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

      return matchesSearch && matchesChannel && matchesStatus;
    });

    setFilteredLogs(filtered);
  }, [logs, searchTerm, filterChannel, filterStatus]);

  const loadNotificationData = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/notifications?days=${selectedDays}`);
      // const data = await response.json();

      // Mock data
      const mockStats: NotificationStats = {
        total_sent: 145,
        total_delivered: 138,
        total_failed: 7,
        delivery_rate: 95.17,
        avg_delivery_time: 2.3,
        channel_breakdown: {
          email: 89,
          push: 34,
          in_app: 22,
          sms: 0
        }
      };

      const mockLogs: NotificationLog[] = [
        {
          id: 'notif_1',
          request_id: 'req_001',
          recipient_id: 'lawyer-1',
          channel: 'email',
          status: 'delivered',
          sent_at: '2024-09-26T03:15:00Z',
          delivered_at: '2024-09-26T03:15:30Z',
          retry_count: 0,
          max_retries: 3,
          created_at: '2024-09-26T03:15:00Z',
          updated_at: '2024-09-26T03:15:30Z'
        },
        {
          id: 'notif_2',
          request_id: 'req_001',
          recipient_id: 'client-1',
          channel: 'email',
          status: 'delivered',
          sent_at: '2024-09-26T03:15:00Z',
          delivered_at: '2024-09-26T03:15:45Z',
          retry_count: 0,
          max_retries: 3,
          created_at: '2024-09-26T03:15:00Z',
          updated_at: '2024-09-26T03:15:45Z'
        },
        {
          id: 'notif_3',
          request_id: 'req_002',
          recipient_id: 'lawyer-2',
          channel: 'push',
          status: 'failed',
          error_message: 'Push token expired',
          retry_count: 2,
          max_retries: 3,
          created_at: '2024-09-26T02:30:00Z',
          updated_at: '2024-09-26T02:35:00Z'
        },
        {
          id: 'notif_4',
          request_id: 'req_003',
          recipient_id: 'client-2',
          channel: 'in_app',
          status: 'delivered',
          sent_at: '2024-09-26T02:00:00Z',
          delivered_at: '2024-09-26T02:00:15Z',
          retry_count: 0,
          max_retries: 3,
          created_at: '2024-09-26T02:00:00Z',
          updated_at: '2024-09-26T02:00:15Z'
        }
      ];

      setStats(mockStats);
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error loading notification data:', error);
      toast.error('알림 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFailed = async (recipientId?: string) => {
    try {
      setRetrying(true);

      // TODO: Replace with actual API call
      // const response = await fetch('/api/notifications', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ action: 'retry', recipient_id: recipientId })
      // });

      // Mock retry
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('실패한 알림을 재전송했습니다.');
      await loadNotificationData();
    } catch (error) {
      console.error('Error retrying notifications:', error);
      toast.error('알림 재전송 중 오류가 발생했습니다.');
    } finally {
      setRetrying(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'push':
        return <Smartphone className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'in_app':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            전송완료
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            전송됨
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            실패
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            대기중
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      email: '이메일',
      push: '푸시 알림',
      sms: 'SMS',
      in_app: '인앱 알림'
    };
    return labels[channel] || channel;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">알림 관리</h1>
            <p className="text-muted-foreground mt-2">
              시스템 알림 발송 현황과 이력을 관리합니다
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedDays} onValueChange={setSelectedDays}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1일</SelectItem>
                <SelectItem value="7">7일</SelectItem>
                <SelectItem value="30">30일</SelectItem>
                <SelectItem value="90">90일</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => loadNotificationData()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 발송</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_sent}</div>
                <p className="text-xs text-muted-foreground">
                  {selectedDays}일간 발송된 알림
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">전송 완료</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{stats.total_delivered}</div>
                <p className="text-xs text-muted-foreground">
                  성공적으로 전송
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">전송 실패</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.total_failed}</div>
                <p className="text-xs text-muted-foreground">
                  전송 실패
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">전송률</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.delivery_rate}%</div>
                <p className="text-xs text-muted-foreground">
                  성공률
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 전송 시간</CardTitle>
                <Clock className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_delivery_time}초</div>
                <p className="text-xs text-muted-foreground">
                  평균 소요 시간
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="logs">알림 로그</TabsTrigger>
            <TabsTrigger value="stats">통계 분석</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  필터
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="수신자 ID, 오류 메시지 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={filterChannel} onValueChange={setFilterChannel}>
                    <SelectTrigger>
                      <SelectValue placeholder="채널" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 채널</SelectItem>
                      <SelectItem value="email">이메일</SelectItem>
                      <SelectItem value="push">푸시 알림</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="in_app">인앱 알림</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 상태</SelectItem>
                      <SelectItem value="pending">대기중</SelectItem>
                      <SelectItem value="sent">전송됨</SelectItem>
                      <SelectItem value="delivered">전송완료</SelectItem>
                      <SelectItem value="failed">실패</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => handleRetryFailed()}
                    disabled={retrying}
                    variant="outline"
                  >
                    {retrying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        재전송 중...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        실패 재전송
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle>알림 로그</CardTitle>
                <CardDescription>
                  최근 알림 발송 이력을 확인할 수 있습니다 ({filteredLogs.length}건)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>요청 ID</TableHead>
                      <TableHead>수신자</TableHead>
                      <TableHead>채널</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>전송 시간</TableHead>
                      <TableHead>재시도</TableHead>
                      <TableHead>오류</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {log.request_id}
                        </TableCell>
                        <TableCell>{log.recipient_id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getChannelIcon(log.channel)}
                            {getChannelLabel(log.channel)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell>
                          {log.sent_at ? formatRelativeTime(log.sent_at) : '-'}
                        </TableCell>
                        <TableCell>
                          {log.retry_count > 0 && (
                            <Badge variant="outline">
                              {log.retry_count}/{log.max_retries}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.error_message && (
                            <div className="max-w-40 truncate text-xs text-destructive">
                              {log.error_message}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.status === 'failed' && log.retry_count < log.max_retries && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetryFailed(log.recipient_id)}
                              disabled={retrying}
                            >
                              재시도
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredLogs.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">알림 로그가 없습니다</h3>
                    <p className="text-muted-foreground">
                      조건에 맞는 알림 로그가 없습니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Channel Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    채널별 발송 현황
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats && Object.entries(stats.channel_breakdown).map(([channel, count]) => (
                      <div key={channel} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getChannelIcon(channel)}
                          <span className="font-medium">{getChannelLabel(channel)}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{count}건</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((count / stats.total_sent) * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    시스템 상태
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>알림 시스템</span>
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      정상
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>이메일 서비스</span>
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      정상
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>푸시 서비스</span>
                    <Badge variant="warning">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      주의
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>대기열 상태</span>
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      정상
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}