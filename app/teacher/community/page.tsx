'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Heart,
  Eye,
  Plus,
  Search,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  Briefcase,
  Scale,
  FileText
} from 'lucide-react';
import Link from 'next/link';
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

const categories = [
  { value: 'all', label: '전체', icon: Users },
  { value: 'notice', label: '공지사항', icon: MessageSquare },
  { value: 'experience', label: '경험공유', icon: Briefcase },
  { value: 'question', label: '질문', icon: FileText },
  { value: 'tip', label: '정보/팁', icon: Scale },
];

export default function CommunityPage() {
  const { user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest'); // latest, popular
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load posts from API
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'all') {
          queryParams.set('category', selectedCategory);
        }
        queryParams.set('limit', '100'); // Load more posts for client-side filtering

        const response = await fetch(`/api/community/posts?${queryParams.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        setPosts(data.posts || []);
      } catch (err) {
        console.error('Error loading posts:', err);
        setError('게시글을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [selectedCategory]);

  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likes - a.likes;
        default: // latest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const getCategoryLabel = (category: string) => {
    const categoryInfo = categories.find(cat => cat.value === category);
    return categoryInfo ? categoryInfo.label : category;
  };

  const handleLike = async (postId: string) => {
    const userId = user?.id || 'anonymous_user';

    try {
      // Optimistic update
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            const hasLiked = post.liked_by.includes(userId);
            return {
              ...post,
              likes: hasLiked ? post.likes - 1 : post.likes + 1,
              liked_by: hasLiked
                ? post.liked_by.filter(id => id !== userId)
                : [...post.liked_by, userId]
            };
          }
          return post;
        })
      );

      // Make API call (we need to implement this endpoint)
      // For now, just log it
      console.log('Toggle like for post:', postId, 'by user:', userId);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      // In production, you'd reload the posts here
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">게시글을 불러오는 중...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">커뮤니티</h1>
            <p className="text-muted-foreground">
              초등교사 선생님들과 교육 현장의 경험을 공유하세요
            </p>
          </div>
          <Link href="/teacher/community/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              글쓰기
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                전체 게시글
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{posts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                오늘 작성된 글
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {posts.filter(p => {
                  const today = new Date().toDateString();
                  return new Date(p.created_at).toDateString() === today;
                }).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 좋아요
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {posts.reduce((sum, p) => sum + p.likes, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                활성 작성자
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(posts.map(p => p.author_id)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="게시글 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category & Sort */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground mr-2">카테고리:</span>
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}

            <div className="ml-auto flex gap-2">
              <Button
                variant={sortBy === 'latest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('latest')}
              >
                <Calendar className="h-4 w-4 mr-1" />
                최신순
              </Button>
              <Button
                variant={sortBy === 'popular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('popular')}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                인기순
              </Button>
            </div>
          </div>
        </div>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">게시글이 없습니다</p>
              <p className="text-sm text-muted-foreground mb-4">
                첫 번째 게시글을 작성해보세요!
              </p>
              <Link href="/teacher/community/new">
                <Button>글쓰기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {getCategoryLabel(post.category)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {post.author}
                        </span>
                        <span className="text-sm text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(post.created_at)}
                        </span>
                      </div>

                      <Link href={`/community/${post.id}`}>
                        <h3 className="text-lg font-semibold mb-2 hover:text-primary cursor-pointer line-clamp-1">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {post.content.replace(/<[^>]*>/g, '')}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1 hover:text-primary transition-colors ${
                            post.liked_by.includes(user?.id || 'anonymous_user')
                              ? 'text-red-500'
                              : ''
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${
                            post.liked_by.includes(user?.id || 'anonymous_user')
                              ? 'fill-current'
                              : ''
                          }`} />
                          <span>{post.likes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
