'use client';

import { useState } from 'react';
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
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/date';
import { useStore } from '@/lib/store';

// Mock data
const mockPosts = [
  {
    id: '1',
    category: 'free',
    title: '효과적인 학부모 상담 방법 공유합니다',
    content: '오늘 있었던 학부모 상담에서 효과적이었던 대화법을 공유하려고 합니다. 먼저 감정적으로 대응하지 않고...',
    author: '익명교사001',
    author_role: 'teacher',
    view_count: 234,
    like_count: 42,
    comment_count: 15,
    created_at: '2025-08-27T14:00:00Z',
    is_popular: true
  },
  {
    id: '2',
    category: 'case',
    title: '교권 침해 대응 경험 공유',
    content: '작년에 겪었던 교권 침해 사건과 대응 과정을 공유합니다. 법적 조치까지 갔던 경험이라 도움이 될 것 같아서...',
    author: '익명교사002',
    author_role: 'teacher',
    view_count: 189,
    like_count: 38,
    comment_count: 12,
    created_at: '2025-08-27T10:30:00Z',
    has_lawyer_comment: true,
    is_popular: true
  },
  {
    id: '3',
    category: 'free',
    title: '신규 교사입니다. 선배님들 조언 부탁드려요',
    content: '이제 막 발령받은 신규 교사입니다. 첫 학부모 상담을 앞두고 있는데 너무 떨립니다. 어떻게 준비하면 좋을까요?',
    author: '익명교사003',
    author_role: 'teacher',
    view_count: 156,
    like_count: 25,
    comment_count: 18,
    created_at: '2025-08-26T16:20:00Z'
  },
  {
    id: '4',
    category: 'case',
    title: '[변호사 답변] 명예훼손 관련 법적 대응 가이드',
    content: '최근 명예훼손 관련 문의가 많아 정리해서 공유드립니다. 명예훼손죄의 성립 요건과 대응 방법에 대해...',
    author: '교육법전문변호사',
    author_role: 'lawyer',
    view_count: 412,
    like_count: 78,
    comment_count: 23,
    created_at: '2025-08-26T09:00:00Z',
    is_lawyer_post: true
  },
  {
    id: '5',
    category: 'free',
    title: '수업 중 학생 스마트폰 사용 어떻게 대처하시나요?',
    content: '요즘 수업 중에 스마트폰 사용하는 학생들이 너무 많아졌어요. 주의를 줘도 잠시뿐이고... 다들 어떻게 대처하시나요?',
    author: '익명교사004',
    author_role: 'teacher',
    view_count: 98,
    like_count: 12,
    comment_count: 9,
    created_at: '2025-08-25T13:45:00Z'
  }
];

const categories = [
  { value: 'all', label: '전체', icon: Users },
  { value: 'free', label: '자유게시판', icon: MessageSquare },
  { value: 'case', label: '사례공유', icon: Briefcase },
];

export default function CommunityPage() {
  const { user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest'); // latest, popular, commented

  // Filter and sort posts
  const filteredPosts = mockPosts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.like_count - a.like_count;
        case 'commented':
          return b.comment_count - a.comment_count;
        default: // latest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

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
          <Link href="/community/write">
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
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold hover:text-primary">
                          <Link href={`/community/${post.id}`}>
                            {post.title}
                          </Link>
                        </h3>
                        {post.is_popular && (
                          <Badge variant="error">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            인기
                          </Badge>
                        )}
                        {post.is_lawyer_post && (
                          <Badge variant="warning">
                            <Briefcase className="h-3 w-3 mr-1" />
                            변호사
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{post.author}</span>
                        {post.author_role === 'lawyer' && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            변호사
                          </Badge>
                        )}
                        <span>·</span>
                        <span>{formatRelativeTime(post.created_at)}</span>
                        <span>·</span>
                        <Badge variant="outline" className="text-xs">
                          {post.category === 'free' ? '자유게시판' : '사례공유'}
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
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{post.like_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comment_count}</span>
                        {post.has_lawyer_comment && (
                          <Badge variant="warning" className="text-xs ml-1">
                            변호사 답변
                          </Badge>
                        )}
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
          ))}

          {filteredPosts.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">게시글이 없습니다</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== 'all'
                    ? '검색 결과가 없습니다. 다른 조건으로 검색해보세요.'
                    : '첫 번째 글을 작성해보세요!'}
                </p>
                {!searchTerm && selectedCategory === 'all' && (
                  <Link href="/community/write">
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