'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { localDB, CommunityPost } from '@/lib/services/localDB';
import { toast } from 'react-hot-toast';

const categories = [
  { value: 'general', label: '일반' },
  { value: 'experience', label: '경험공유' },
  { value: 'advice', label: '조언구함' },
  { value: 'legal', label: '법적정보' },
  { value: 'support', label: '심리지원' },
];

export default function EditCommunityPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useStore();
  const postId = params.id as string;

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '' as 'general' | 'experience' | 'advice' | 'legal' | 'support' | ''
  });

  const [errors, setErrors] = useState({
    title: '',
    content: '',
    category: ''
  });

  useEffect(() => {
    const loadPost = () => {
      try {
        const foundPost = localDB.getPostById(postId);
        if (!foundPost) {
          toast.error('게시글을 찾을 수 없습니다.');
          router.push('/community');
          return;
        }

        // Check if user is the author
        if (foundPost.authorId !== (user?.id || 'anonymous_user')) {
          toast.error('수정 권한이 없습니다.');
          router.push(`/community/${postId}`);
          return;
        }

        setPost(foundPost);
        setFormData({
          title: foundPost.title,
          content: foundPost.content,
          category: foundPost.category
        });
      } catch (error) {
        console.error('Error loading post:', error);
        toast.error('게시글을 불러오는 중 오류가 발생했습니다.');
        router.push('/community');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, router, user]);

  const validateForm = () => {
    const newErrors = {
      title: '',
      content: '',
      category: ''
    };

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    } else if (formData.title.length > 100) {
      newErrors.title = '제목은 100자 이내로 입력해주세요.';
    }

    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요.';
    } else if (formData.content.length < 10) {
      newErrors.content = '내용은 10자 이상 입력해주세요.';
    }

    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요.';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedPost = localDB.updatePost(postId, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category as 'general' | 'experience' | 'advice' | 'legal' | 'support'
      });

      if (updatedPost) {
        toast.success('게시글이 성공적으로 수정되었습니다.');
        router.push(`/community/${postId}`);
      } else {
        toast.error('게시글 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('게시글 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
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

  if (!post) {
    return (
      <DashboardLayout>
        <Card className="text-center py-16">
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">게시글을 찾을 수 없습니다</h3>
            <p className="text-gray-600 mb-4">요청하신 게시글이 존재하지 않거나 삭제되었습니다.</p>
            <Button onClick={() => router.push('/community')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              커뮤니티로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/community/${postId}`)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            게시글로 돌아가기
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">글 수정</CardTitle>
            <p className="text-muted-foreground">
              게시글 내용을 수정하세요.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">카테고리 *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  placeholder="게시글 제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={errors.title ? 'border-red-300 focus:border-red-500' : ''}
                  maxLength={100}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  {errors.title ? (
                    <p className="text-red-600">{errors.title}</p>
                  ) : (
                    <span></span>
                  )}
                  <span>{formData.title.length}/100</span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">내용 *</Label>
                <Textarea
                  id="content"
                  placeholder="게시글 내용을 입력하세요"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className={`min-h-[300px] ${errors.content ? 'border-red-300 focus:border-red-500' : ''}`}
                />
                {errors.content && (
                  <p className="text-sm text-red-600">{errors.content}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  최소 10자 이상 입력해주세요.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/community/${postId}`)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      수정 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      수정 완료
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">수정 시 주의사항</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ul className="list-disc list-inside space-y-1">
              <li>수정된 내용은 즉시 반영됩니다.</li>
              <li>기존 댓글과 좋아요는 유지됩니다.</li>
              <li>카테고리 변경 시 적절한 카테고리를 선택해주세요.</li>
              <li>부적절한 내용으로 수정 시 게시글이 삭제될 수 있습니다.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}