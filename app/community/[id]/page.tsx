'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Send,
  Calendar,
  User,
  MessageCircle,
  ThumbsUp,
  Trash2,
  Edit3,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/lib/utils/date';
import { useStore } from '@/lib/store';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  author_id: string;
  category: 'notice' | 'experience' | 'question' | 'tip';
  likes: number;
  liked_by: string[];
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  content: string;
  author: string;
  author_id: string;
  parent_comment_id?: string | null;
  created_at: string;
  updated_at: string;
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useStore();
  const postId = params.id as string;

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const currentUser = {
    id: user?.id || 'anonymous_user',
    name: '익명사용자'
  };

  useEffect(() => {
    if (!postId) return;

    const loadPost = async () => {
      try {
        setLoading(true);

        // Load post from API
        const response = await fetch(`/api/community/posts/${postId}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast.error('게시글을 찾을 수 없습니다.');
            router.push('/community');
            return;
          }
          throw new Error('Failed to load post');
        }

        const postData = await response.json();
        setPost(postData);

        // TODO: Load comments from API (not yet implemented)
        setComments([]);
      } catch (error) {
        console.error('Error loading post:', error);
        toast.error('게시글을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, router]);

  const handleLike = async () => {
    if (!post) return;

    try {
      // Optimistic update
      setPost(prev => {
        if (!prev) return prev;
        const hasLiked = prev.liked_by.includes(currentUser.id);
        return {
          ...prev,
          likes: hasLiked ? prev.likes - 1 : prev.likes + 1,
          liked_by: hasLiked
            ? prev.liked_by.filter(id => id !== currentUser.id)
            : [...prev.liked_by, currentUser.id]
        };
      });

      // TODO: Make API call to update like
      console.log('Toggle like for post:', post.id);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleCommentLike = (commentId: string) => {
    // TODO: Implement comment like API
    toast.info('댓글 기능은 아직 구현 중입니다.');
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Implement comment creation API
    toast.info('댓글 기능은 아직 구현 중입니다.');
    return;

    if (!newComment.trim() || !post) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setSubmittingComment(true);

    try {
      // API call would go here
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    // TODO: Implement comment deletion API
    toast.info('댓글 기능은 아직 구현 중입니다.');
  };

  const handleDeletePost = async () => {
    try {
      const response = await fetch(`/api/community/posts/${postId}?authorId=${currentUser.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      toast.success('게시글이 삭제되었습니다.');
      router.push('/community');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('게시글 삭제 중 오류가 발생했습니다.');
    }
    setDeleteDialogOpen(false);
  };

  const handleEditPost = () => {
    router.push(`/community/${postId}/edit`);
  };

  const getCategoryInfo = (category: string) => {
    const categories = {
      general: { label: '일반', color: 'text-blue-600' },
      experience: { label: '경험공유', color: 'text-green-600' },
      advice: { label: '조언구함', color: 'text-orange-600' },
      legal: { label: '법적정보', color: 'text-purple-600' },
      support: { label: '심리지원', color: 'text-pink-600' },
    };
    return categories[category as keyof typeof categories] || { label: category, color: 'text-gray-600' };
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

  if (!post) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">게시글을 찾을 수 없습니다</h3>
          <p className="text-muted-foreground mb-4">삭제되었거나 존재하지 않는 게시글입니다.</p>
          <Link href="/community">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              커뮤니티로 돌아가기
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const categoryInfo = getCategoryInfo(post.category);
  const isLiked = post.likedBy.includes(currentUser.id);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/community">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              커뮤니티로 돌아가기
            </Button>
          </Link>

          {/* Post Actions - Only show for author */}
          {post && currentUser.id === post.authorId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditPost}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  수정하기
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제하기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Post Content */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              {/* Title and Category */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{post.title}</h1>
                  <Badge variant="outline" className={categoryInfo.color}>
                    {categoryInfo.label}
                  </Badge>
                </div>
              </div>

              {/* Meta Information */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatRelativeTime(post.createdAt)}</span>
                </div>
              </div>

            </div>
          </CardHeader>
          <CardContent>
            {/* Content */}
            <div className="prose prose-gray max-w-none mb-6">
              <p className="whitespace-pre-wrap text-base leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isLiked 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes}</span>
                <span className="text-sm">좋아요</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2">
                <MessageSquare className="h-4 w-4" />
                <span>{comments.length}</span>
                <span className="text-sm">댓글</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              댓글 {comments.length}개
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <Textarea
                placeholder="댓글을 작성해주세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={1000}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {newComment.length}/1000자
                </p>
                <Button 
                  type="submit" 
                  disabled={!newComment.trim() || submittingComment}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {submittingComment ? '작성 중...' : '댓글 작성'}
                </Button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>첫 번째 댓글을 작성해보세요!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                    {/* Comment Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-muted-foreground">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      {comment.authorId === currentUser.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Comment Content */}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>

                    {/* Comment Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCommentLike(comment.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          comment.likedBy.includes(currentUser.id)
                            ? 'bg-red-50 text-red-600'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <ThumbsUp className={`h-3 w-3 ${
                          comment.likedBy.includes(currentUser.id) ? 'fill-current' : ''
                        }`} />
                        <span>{comment.likes}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                이 게시글을 정말 삭제하시겠습니까? 삭제된 게시글과 모든 댓글은 복구할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePost}
                className="bg-red-600 hover:bg-red-700"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}