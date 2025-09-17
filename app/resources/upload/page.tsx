'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const categories = [
  { value: '교육과정', label: '교육과정' },
  { value: '학급경영', label: '학급경영' },
  { value: '상담', label: '상담' },
  { value: '평가', label: '평가' },
  { value: '수업자료', label: '수업자료' },
  { value: '행정', label: '행정' },
  { value: '기타', label: '기타' }
];

const allowedFileTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.hancom.hwp',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const maxFileSize = 50 * 1024 * 1024; // 50MB

export default function ResourceUploadPage() {
  const router = useRouter();
  const { user } = useStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!allowedFileTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        file: '지원하지 않는 파일 형식입니다. PDF, 워드, 한글, 파워포인트, 엑셀, 텍스트 파일만 업로드 가능합니다.'
      }));
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setErrors(prev => ({
        ...prev,
        file: '파일 크기가 너무 큽니다. 최대 50MB까지 업로드 가능합니다.'
      }));
      return;
    }

    setSelectedFile(file);
    setErrors(prev => ({ ...prev, file: '' }));
  };

  const removeFile = () => {
    setSelectedFile(null);
    setErrors(prev => ({ ...prev, file: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }

    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요.';
    }

    if (!selectedFile) {
      newErrors.file = '업로드할 파일을 선택해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      setErrors({ general: '로그인이 필요합니다.' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile!);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('category', formData.category);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/resources/upload', {
        method: 'POST',
        body: uploadFormData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '업로드 중 오류가 발생했습니다.');
      }

      // Success
      setTimeout(() => {
        router.push('/resources');
      }, 1000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setErrors({ general: error.message });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/resources">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              자료실로 돌아가기
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Upload className="h-8 w-8 text-primary-600" />
            자료 업로드
          </h1>
          <p className="text-muted-foreground mt-2">
            다른 선생님들과 공유할 유용한 자료를 업로드해주세요
          </p>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>자료 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Error */}
              {errors.general && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{errors.general}</span>
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="자료의 제목을 입력해주세요"
                  className={`input-modern ${errors.title ? 'border-red-500' : ''}`}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`input-modern ${errors.category ? 'border-red-500' : ''}`}
                >
                  <option value="">카테고리를 선택해주세요</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">설명</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="자료에 대한 간단한 설명을 입력해주세요"
                  rows={4}
                  className="input-modern resize-none"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  파일 <span className="text-red-500">*</span>
                </label>

                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.hwp,.ppt,.pptx,.xls,.xlsx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium mb-2">파일을 선택하거나 드래그해주세요</p>
                      <p className="text-sm text-muted-foreground">
                        PDF, 워드, 한글, 파워포인트, 엑셀, 텍스트 파일 (최대 50MB)
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg bg-accent/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary-600" />
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {errors.file && (
                  <p className="text-sm text-red-500">{errors.file}</p>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>업로드 중...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {uploadProgress === 100 && !isUploading && (
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">업로드가 완료되었습니다! 자료실로 이동합니다...</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Link href="/resources">
                  <Button type="button" variant="outline" disabled={isUploading}>
                    취소
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isUploading || uploadProgress === 100}
                  className="btn-primary-modern"
                >
                  {isUploading ? '업로드 중...' : '자료 업로드'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">업로드 가이드라인</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>교육 목적으로 사용할 수 있는 자료만 업로드해주세요.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>저작권에 문제가 없는 자료인지 확인해주세요.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>개인정보가 포함된 자료는 업로드하지 마세요.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>명확하고 이해하기 쉬운 제목과 설명을 작성해주세요.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}