'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Share2,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  Eye,
  MessageSquare,
  TrendingUp,
  Heart,
  HeartHandshake,
  Send,
  Shield,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Scale,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/date';
import { AuthGuard } from '@/components/auth/permission-guard';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAssociations } from '@/lib/hooks/useAssociations';

interface SharedReport {
  id: string;
  originalReportId: string;
  title: string;
  content: string;
  category: string;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sharedByUserId: string;
  sharedByUserName: string;
  associationId: string;
  associationName: string;
  shareMessage?: string;
  shareType: 'association' | 'similar_cases' | 'lawyer_consult';
  anonymized: boolean;
  viewCount: number;
  discussionCount: number;
  supportCount: number;
  tags: string[];
  supporters: string[];
  discussions: Discussion[];
  relatedActions: string[];
  sharedAt: string;
  lastActivity: string;
}

interface Discussion {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  supportCount: number;
  supporters: string[];
  isAnonymous: boolean;
  createdAt: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
}

const shareTypeLabels = {
  association: '협회 공유',
  similar_cases: '유사 사례',
  lawyer_consult: '변호사 상담'
};

const statusLabels = {
  pending: '대기중',
  processing: '처리중',
  resolved: '해결됨',
  rejected: '반려됨'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export default function SharedReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const { associations } = useAssociations(profile?.id);

  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [discussionContent, setDiscussionContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);
  const [error, setError] = useState('');

  const reportId = params.id as string;

  // Mock data loading
  useEffect(() => {
    const loadSharedReport = () => {
      // Mock shared report data
      const mockReport: SharedReport = {
        id: reportId,
        originalReportId: 'report_123',
        title: '학교 내 괴롭힘 사건에 대한 집단 대응 요청',
        content: `안녕하세요. 저는 현재 직장 내 괴롭힘으로 인해 매우 어려운 상황에 처해 있습니다.

**상황 개요:**
- 동료 교사 A로부터 지속적인 언어적 괴롭힘
- 업무 배제 및 의도적 고립
- 다른 교사들 앞에서의 모욕적 발언
- 허위 사실 유포

**현재까지 시도한 조치:**
1. 개인적 대화 시도 (실패)
2. 학교장 상담 (미해결)
3. 교육청 신고 접수
4. 증거 자료 수집

저와 같은 경험을 하신 분들이 있다면 어떻게 대응하셨는지, 그리고 함께 대응할 수 있는 방법이 있는지 알고 싶습니다.

집단으로 대응하면 더 큰 효과를 볼 수 있을 것 같습니다.`,
        category: 'harassment',
        status: 'processing',
        priority: 'high',
        sharedByUserId: 'teacher1',
        sharedByUserName: '김선생',
        associationId: 'assoc1',
        associationName: '서울교사협회',
        shareMessage: '유사한 경험이 있는 동료 선생님들의 조언과 함께 집단 대응을 모색하고 싶습니다.',
        shareType: 'association',
        anonymized: false,
        viewCount: 47,
        discussionCount: 8,
        supportCount: 15,
        tags: ['괴롭힘', '집단대응', '법적조치', '교육청신고'],
        supporters: ['teacher2', 'teacher3', 'teacher4'],
        discussions: [
          {
            id: 'disc1',
            authorId: 'teacher2',
            authorName: '이선생',
            content: '저도 비슷한 경험이 있습니다. 교육청 신고와 함께 노조에 도움을 요청하는 것도 효과적이었습니다. 여러 명이 함께 신고하면 더 신속하게 처리됩니다.',
            supportCount: 8,
            supporters: ['teacher1', 'teacher3'],
            isAnonymous: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            replies: [
              {
                id: 'reply1',
                authorId: 'teacher1',
                authorName: '김선생',
                content: '좋은 조언 감사합니다. 노조 연락처를 알 수 있을까요?',
                isAnonymous: false,
                createdAt: new Date(Date.now() - 1800000).toISOString(),
              }
            ]
          },
          {
            id: 'disc2',
            authorId: 'teacher3',
            authorName: '익명',
            content: '저는 작년에 비슷한 사건으로 법적 대응을 했습니다. 증거 자료가 중요하니 모든 것을 기록으로 남기세요. 필요하면 개인적으로 연락 주세요.',
            supportCount: 12,
            supporters: ['teacher1', 'teacher2'],
            isAnonymous: true,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            replies: []
          }
        ],
        relatedActions: [
          '교육청 신고 접수 완료',
          '증거 자료 수집 진행중',
          '협회 법률 지원팀 연결 예정'
        ],
        sharedAt: new Date(Date.now() - 86400000).toISOString(),
        lastActivity: new Date(Date.now() - 1800000).toISOString(),
      };

      setReport(mockReport);
      setLoading(false);

      // Increment view count (mock)
      if (mockReport && profile?.id !== mockReport.sharedByUserId) {
        mockReport.viewCount += 1;
      }
    };

    loadSharedReport();
  }, [reportId, profile?.id]);

  const handleSupport = async () => {
    if (!report || !profile) return;

    try {
      const isCurrentlySupporting = report.supporters.includes(profile.id);

      if (isCurrentlySupporting) {
        // Remove support
        setReport(prev => prev ? {
          ...prev,
          supporters: prev.supporters.filter(id => id !== profile.id),
          supportCount: prev.supportCount - 1
        } : null);
      } else {
        // Add support
        setReport(prev => prev ? {
          ...prev,
          supporters: [...prev.supporters, profile.id],
          supportCount: prev.supportCount + 1
        } : null);
      }
    } catch (error) {
      console.error('Support error:', error);
    }
  };

  const handleSubmitDiscussion = async () => {
    if (!discussionContent.trim() || !profile || !report) {
      setError('토론 내용을 입력해주세요.');
      return;
    }

    setSubmittingDiscussion(true);
    setError('');

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newDiscussion: Discussion = {
        id: `disc_${Date.now()}`,
        authorId: profile.id,
        authorName: isAnonymous ? '익명' : profile.name,
        content: discussionContent.trim(),
        supportCount: 0,
        supporters: [],
        isAnonymous,
        createdAt: new Date().toISOString(),
        replies: []
      };

      setReport(prev => prev ? {
        ...prev,
        discussions: [...prev.discussions, newDiscussion],
        discussionCount: prev.discussionCount + 1,
        lastActivity: new Date().toISOString()
      } : null);

      setDiscussionContent('');
      setIsAnonymous(false);
    } catch (error) {
      setError('토론 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  const handleSupportDiscussion = async (discussionId: string) => {
    if (!profile || !report) return;

    try {
      setReport(prev => {
        if (!prev) return null;

        return {
          ...prev,
          discussions: prev.discussions.map(discussion => {
            if (discussion.id === discussionId) {
              const isCurrentlySupporting = discussion.supporters.includes(profile.id);

              if (isCurrentlySupporting) {
                return {
                  ...discussion,
                  supporters: discussion.supporters.filter(id => id !== profile.id),
                  supportCount: discussion.supportCount - 1
                };
              } else {
                return {
                  ...discussion,
                  supporters: [...discussion.supporters, profile.id],
                  supportCount: discussion.supportCount + 1
                };
              }
            }
            return discussion;
          })
        };
      });
    } catch (error) {
      console.error('Discussion support error:', error);
    }
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

  if (!report) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">공유 신고서를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">
            존재하지 않거나 삭제된 공유 신고서입니다.
          </p>
          <Link href="/shared-reports">
            <Button>공유 신고서 목록으로 돌아가기</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isSupporting = report.supporters.includes(profile?.id || '');
  const isAuthor = report.sharedByUserId === profile?.id;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/shared-reports">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{report.title}</h1>
                <Badge className={statusColors[report.status]}>
                  {statusLabels[report.status]}
                </Badge>
                <Badge className={priorityColors[report.priority]}>
                  {report.priority}
                </Badge>
                {report.anonymized && (
                  <Badge variant="secondary">
                    <Shield className="h-3 w-3 mr-1" />
                    익명
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{report.anonymized ? '익명' : report.sharedByUserName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{report.associationName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatRelativeTime(report.sharedAt)}</span>
                </div>
                <Badge variant="outline">
                  {shareTypeLabels[report.shareType]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Eye className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold">{report.viewCount}</div>
                <div className="text-sm text-muted-foreground">조회수</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageSquare className="h-6 w-6 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold">{report.discussionCount}</div>
                <div className="text-sm text-muted-foreground">토론</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold">{report.supportCount}</div>
                <div className="text-sm text-muted-foreground">지지</div>
              </CardContent>
            </Card>
          </div>

          {/* Share Message */}
          {report.shareMessage && (
            <Alert>
              <Share2 className="h-4 w-4" />
              <AlertDescription>
                <strong>공유 메시지:</strong> {report.shareMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content */}
          <Card>
            <CardHeader>
              <CardTitle>신고 내용</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {report.content}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {report.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>관련 태그</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {report.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Actions */}
          {report.relatedActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>진행 상황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.relatedActions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Support Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">이 사례를 지지합니다</span>
                    <Badge variant="secondary">{report.supportCount}명</Badge>
                  </div>
                </div>
                <Button
                  onClick={handleSupport}
                  variant={isSupporting ? "default" : "outline"}
                  size="sm"
                >
                  <Heart className={`h-4 w-4 mr-2 ${isSupporting ? 'fill-current' : ''}`} />
                  {isSupporting ? '지지 취소' : '지지하기'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Discussions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                토론 ({report.discussionCount})
              </CardTitle>
              <CardDescription>
                경험과 조언을 공유하여 함께 해결방안을 모색해보세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Discussion List */}
              {report.discussions.map((discussion) => (
                <div key={discussion.id} className="border-l-4 border-muted pl-6 space-y-3">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {discussion.isAnonymous ? '익' : discussion.authorName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {discussion.isAnonymous ? '익명' : discussion.authorName}
                        </span>
                        {discussion.isAnonymous && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            익명
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(discussion.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {discussion.content}
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSupportDiscussion(discussion.id)}
                          className={discussion.supporters.includes(profile?.id || '') ? 'text-red-600' : ''}
                        >
                          <Heart className={`h-4 w-4 mr-1 ${discussion.supporters.includes(profile?.id || '') ? 'fill-current' : ''}`} />
                          {discussion.supportCount}
                        </Button>
                      </div>

                      {/* Replies */}
                      {discussion.replies.length > 0 && (
                        <div className="ml-8 space-y-3 border-l-2 border-muted pl-4">
                          {discussion.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-3">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {reply.isAnonymous ? '익' : reply.authorName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">
                                    {reply.isAnonymous ? '익명' : reply.authorName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatRelativeTime(reply.createdAt)}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {reply.content}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {report.discussions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  아직 토론이 없습니다. 첫 번째 의견을 남겨보세요!
                </div>
              )}

              {/* Add Discussion */}
              <div className="border-t pt-6 space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Textarea
                  placeholder="경험과 조언을 공유해주세요..."
                  value={discussionContent}
                  onChange={(e) => setDiscussionContent(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded"
                      />
                      익명으로 작성
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {discussionContent.length}/1000자
                    </span>
                  </div>
                  <Button
                    onClick={handleSubmitDiscussion}
                    disabled={submittingDiscussion || !discussionContent.trim()}
                  >
                    {submittingDiscussion ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        등록 중...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        토론 참여
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>관련 링크</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Link href={`/reports/${report.originalReportId}`}>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  원본 신고서 보기
                </Button>
              </Link>
              <Link href="/shared-reports">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  다른 공유 사례 보기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}