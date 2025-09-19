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
import { localDB, CommunityPost } from '@/lib/services/localDB';

const categories = [
  { value: 'all', label: '전체', icon: Users },
  { value: 'general', label: '일반', icon: MessageSquare },
  { value: 'experience', label: '경험공유', icon: Briefcase },
  { value: 'advice', label: '조언구함', icon: FileText },
  { value: 'legal', label: '법적정보', icon: Scale },
  { value: 'support', label: '심리지원', icon: Heart },
];

export default function CommunityPage() {
  const { user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest'); // latest, popular, commented
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Load posts from local DB
  useEffect(() => {
    const loadPosts = () => {
      try {
        const allPosts = localDB.getAllPosts();
        // Sort by createdAt descending (newest first)
        const sortedPosts = allPosts.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPosts(sortedPosts);
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
    
    // Initialize with sample data if no posts exist
    if (localDB.getAllPosts().length === 0) {
      localDB.initWithSampleData();
      loadPosts();
    }
  }, []);

  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likes - a.likes;
        case 'commented':
          // Get comment count for each post
          const aComments = localDB.getCommentsByPostId(a.id).length;
          const bComments = localDB.getCommentsByPostId(b.id).length;
          return bComments - aComments;
        default: // latest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const getCategoryLabel = (category: string) => {
    const categoryInfo = categories.find(cat => cat.value === category);
    return categoryInfo ? categoryInfo.label : category;
  };

  const handleLike = (postId: string) => {
    const userId = user?.id || 'anonymous_user';
    const updatedPost = localDB.togglePostLike(postId, userId);
    if (updatedPost) {
      // Update the posts state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? updatedPost : post
        )
      );
    }
  };

  // Function to refresh posts list
  const refreshPosts = () => {
    try {
      const allPosts = localDB.getAllPosts();
      const sortedPosts = allPosts.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error refreshing posts:', error);
    }
  };

  // Add event listener for post changes
  useEffect(() => {
    const handleStorageChange = () => {
      refreshPosts();
    };

    // Refresh posts when returning to this page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshPosts();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
            <h1 className="text-3xl font-bold">커뮤니티</h1>
            <p className="text-muted-foreground mt-2">
              교사들과 경험을 공유하고 서로 도움을 주고받는 공간입니다
            </p>
          </div>
          <Link href="/community/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              글 작성
            </Button>
          </Link>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
              >
                <Icon className="h-4 w-4 mr-1" />
                {category.label}
              </Button>
            );
          })}
        </div>

        {/* Search and Sort */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="게시글 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'latest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('latest')}
                >
                  최신순
                </Button>
                <Button
                  variant={sortBy === 'popular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('popular')}
                >
                  인기순
                </Button>
                <Button
                  variant={sortBy === 'commented' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('commented')}
                >
                  댓글순
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        <div className="space-y-6">
          {filteredPosts.map((post) => {
            const commentCount = localDB.getCommentsByPostId(post.id).length;
            const isPopular = post.likes > 10 || commentCount > 5;

            return (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="px-8 pt-4 pb-8">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold hover:text-primary">
                            <Link href={`/community/${post.id}`}>
                              {post.title}
                            </Link>
                          </h3>
                          {isPopular && (
                            <Badge variant="error">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              인기
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{post.author}</span>
                          <span>·</span>
                          <span>{formatRelativeTime(post.createdAt)}</span>
                          <span>·</span>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(post.category)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.content}
                    </p>


                    {/* Footer Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <button 
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                            post.likedBy.includes(user?.id || 'anonymous_user') ? 'text-red-500' : ''
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${
                            post.likedBy.includes(user?.id || 'anonymous_user') ? 'fill-current' : ''
                          }`} />
                          <span>{post.likes}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{commentCount}</span>
                        </div>
                      </div>
                      <Link href={`/community/${post.id}`}>
                        <Button variant="ghost" size="sm">
                          자세히 보기
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredPosts.length === 0 && (
            <Card>
              <CardContent className="text-center py-16">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">게시글이 없습니다</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== 'all'
                    ? '검색 결과가 없습니다. 다른 조건으로 검색해보세요.'
                    : '첫 번째 글을 작성해보세요!'}
                </p>
                {!searchTerm && selectedCategory === 'all' && (
                  <Link href="/community/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      첫 글 작성하기
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {filteredPosts.length > 0 && (
          <div className="flex justify-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              이전
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              다음
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}