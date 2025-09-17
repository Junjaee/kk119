'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import {
  BookOpen,
  Search,
  Plus,
  Download,
  Filter,
  FileText,
  File,
  Calendar,
  User,
  ArrowRight,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatRelativeTime } from '@/lib/utils/date';

interface Resource {
  id: number;
  title: string;
  description?: string;
  category: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploader_name: string;
  download_count: number;
  created_at: string;
}

const categories = [
  { value: '', label: '전체' },
  { value: '교육과정', label: '교육과정' },
  { value: '학급경영', label: '학급경영' },
  { value: '상담', label: '상담' },
  { value: '평가', label: '평가' },
  { value: '수업자료', label: '수업자료' },
  { value: '행정', label: '행정' },
  { value: '기타', label: '기타' }
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
  if (fileType.includes('word') || fileType.includes('hwp')) return <FileText className="h-4 w-4 text-blue-500" />;
  if (fileType.includes('presentation')) return <FileText className="h-4 w-4 text-orange-500" />;
  if (fileType.includes('spreadsheet')) return <FileText className="h-4 w-4 text-green-500" />;
  return <File className="h-4 w-4 text-gray-500" />;
}

export default function ResourcesPage() {
  const { user } = useStore();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch resources from API
  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/resources?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch resources on component mount and when filters change
  useEffect(() => {
    fetchResources();
  }, [selectedCategory, searchTerm]);

  const handleDownload = async (resourceId: number) => {
    try {
      const response = await fetch(`/api/resources/${resourceId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ''; // Filename will be set by Content-Disposition header
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Refresh resources to update download count
        fetchResources();
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary-600" />
              교권 자료실
            </h1>
            <p className="text-muted-foreground mt-2">
              교사들이 공유하는 유용한 교육 자료를 찾아보세요
            </p>
          </div>
          <Link href="/resources/upload">
            <Button className="btn-primary-modern">
              <Plus className="h-4 w-4 mr-2" />
              자료 업로드
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="자료 제목이나 내용으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-modern pl-10 w-full"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-modern min-w-[120px]"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">전체 자료</p>
                  <p className="text-2xl font-bold">{resources.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">총 다운로드</p>
                  <p className="text-2xl font-bold">
                    {resources.reduce((sum, r) => sum + r.download_count, 0)}
                  </p>
                </div>
                <Download className="h-8 w-8 text-trust-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">카테고리</p>
                  <p className="text-2xl font-bold">{categories.length - 1}</p>
                </div>
                <Filter className="h-8 w-8 text-protection-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resources List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-accent/30">
                          {getFileIcon(resource.file_type)}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold hover:text-primary-600 cursor-pointer">
                              {resource.title}
                            </h3>
                            <Badge variant="secondary" className="ml-3">
                              {resource.category}
                            </Badge>
                          </div>

                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {resource.description}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {resource.uploader_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatRelativeTime(resource.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {resource.download_count}회
                            </span>
                            <span>
                              {formatFileSize(resource.file_size)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        className="btn-trust-modern"
                        onClick={() => handleDownload(resource.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        다운로드
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && resources.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || selectedCategory ? '검색 결과가 없습니다' : '아직 등록된 자료가 없습니다'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || selectedCategory
                  ? '다른 검색어나 카테고리를 시도해보세요'
                  : '첫 번째 자료를 업로드해보세요'
                }
              </p>
              {searchTerm || selectedCategory ? (
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}>
                  필터 초기화
                </Button>
              ) : (
                <Link href="/resources/upload">
                  <Button className="btn-primary-modern">
                    <Plus className="h-4 w-4 mr-2" />
                    자료 업로드
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}