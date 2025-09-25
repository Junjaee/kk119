'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle2,
  Send,
  Shield,
  Paperclip,
  Download,
  Eye
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface ConsultDetail {
  id: number;
  uuid: string;
  title: string;
  report_type: string;
  incident_date: string;
  report_content: string;
  consult_content?: string;
  status: string;
  created_at: string;
  claimed_at?: string;
  answered_at?: string;
  user_nickname?: string;
  lawyer_name?: string;
}

interface Reply {
  id: number;
  content: string;
  is_lawyer: boolean;
  user_nickname?: string;
  created_at: string;
}

interface Attachment {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export default function ConsultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useStore();

  const [consult, setConsult] = useState<ConsultDetail | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchConsultDetail();
  }, [params.uuid]);

  const fetchConsultDetail = async () => {
    try {
      const response = await fetch(`/api/lawyer/consult/${params.uuid}`);
      const data = await response.json();

      if (response.status === 403) {
        toast.error('이 상담에 접근 권한이 없습니다');
        router.push('/lawyer');
        return;
      }

      if (response.status === 404) {
        toast.error('상담을 찾을 수 없습니다');
        router.push('/lawyer');
        return;
      }

      if (data.success) {
        setConsult(data.data.consult);
        setReplies(data.data.replies || []);
        setAttachments(data.data.attachments || []);
      }
    } catch (error) {
      console.error('Error fetching consult:', error);
      toast.error('상담 정보를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      toast.error('답변 내용을 입력해주세요');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/lawyer/consult/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultId: consult?.id,
          content: replyContent,
          isLawyer: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('답변이 등록되었습니다');
        setReplyContent('');
        fetchConsultDetail(); // Refresh data
      } else {
        toast.error(data.error || '답변 등록 실패');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error('답변 등록 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
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
        return <Badge variant="secondary">대기중</Badge>;
      case 'reviewing':
        return <Badge variant="warning">답변대기</Badge>;
      case 'answered':
        return <Badge className="bg-green-500">답변완료</Badge>;
      case 'follow_up':
        return <Badge className="bg-orange-500">추가답변</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">종료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">상담 정보를 불러오는 중...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!consult) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">상담을 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">
            요청하신 상담이 존재하지 않거나 접근 권한이 없습니다.
          </p>
          <Button onClick={() => router.push('/lawyer')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/lawyer')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <div className="flex items-center gap-2">
            {getStatusBadge(consult.status)}
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <CardTitle className="text-2xl">{consult.title}</CardTitle>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {getTypeLabel(consult.report_type)}
                </Badge>
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
                  접수일시: {formatDateTime(consult.created_at)}
                </span>
                {consult.claimed_at && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    담당일시: {formatDateTime(consult.claimed_at)}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 신고 내용 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                신고 내용
              </h3>
              <div className="bg-accent/30 rounded-lg p-6 whitespace-pre-wrap">
                {consult.report_content}
              </div>
            </div>

            {/* 첨부파일 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-primary" />
                첨부파일 {attachments.length > 0 && `(${attachments.length}개)`}
              </h3>
              {attachments.length > 0 ? (
                <div className="grid gap-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{attachment.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(attachment.file_size / 1024 / 1024).toFixed(2)} MB • {attachment.file_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // TODO: 파일 미리보기 기능
                            toast.info('파일 미리보기 기능 준비중입니다');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            window.open(`/api/attachments/${attachment.id}/download`, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    첨부된 파일이 없습니다
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* 기존 답변 */}
            {consult.consult_content && (
              <>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    변호사 답변
                  </h3>
                  <div className="bg-primary/5 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>{consult.lawyer_name || '담당 변호사'}</span>
                      {consult.answered_at && (
                        <>
                          <span>•</span>
                          <span>{formatDateTime(consult.answered_at)}</span>
                        </>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {consult.consult_content}
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* 추가 대화 내역 */}
            {replies.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    추가 대화
                  </h3>
                  <div className="space-y-3">
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`rounded-lg p-4 ${
                          reply.is_lawyer
                            ? 'bg-primary/5 ml-8'
                            : 'bg-accent/30 mr-8'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          {reply.is_lawyer ? (
                            <Shield className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                          <span>{reply.is_lawyer ? '변호사' : '교사'}</span>
                          <span>•</span>
                          <span>{formatDateTime(reply.created_at)}</span>
                        </div>
                        <div className="whitespace-pre-wrap">
                          {reply.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* 답변 작성 폼 */}
            {(consult.status === 'reviewing' ||
              consult.status === 'follow_up' ||
              consult.status === 'answered') && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  {consult.status === 'reviewing' ? '답변 작성' : '추가 답변'}
                </h3>
                <Textarea
                  placeholder={
                    consult.status === 'reviewing'
                      ? '교사님께 전달할 법률 자문을 작성해주세요...'
                      : '추가 답변을 작성해주세요...'
                  }
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setReplyContent('')}
                    disabled={submitting}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSubmitReply}
                    disabled={submitting || !replyContent.trim()}
                  >
                    {submitting ? '전송 중...' : '답변 전송'}
                    <Send className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* 종료된 상담 안내 */}
            {consult.status === 'completed' && (
              <div className="bg-accent/30 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  이 상담은 종료되었습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}