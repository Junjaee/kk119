'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useStore } from '@/lib/store';
import { FileText, Upload, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils/date';

export default function NewReportPage() {
  const router = useRouter();
  const { user } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    incident_date: formatDate(new Date(), 'YYYY-MM-DD'),
    content: '',
    files: [] as File[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.type || !formData.title || !formData.content) {
      toast.error('필수 항목을 모두 입력해주세요');
      return;
    }

    if (formData.content.length < 50) {
      toast.error('상황 설명은 최소 50자 이상 입력해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('신고가 성공적으로 접수되었습니다');
      router.push('/reports');
    } catch (error) {
      toast.error('신고 접수 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file size (max 10MB each)
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} 파일이 10MB를 초과합니다`);
        return false;
      }
      return true;
    });

    // Max 5 files
    if (formData.files.length + validFiles.length > 5) {
      toast.error('최대 5개까지 파일을 첨부할 수 있습니다');
      return;
    }

    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">교권 침해 신고하기</h1>
          <p className="text-muted-foreground mt-2">
            신고 내용은 철저히 보호되며, 익명으로 처리됩니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>신고 정보</CardTitle>
              <CardDescription>
                발생한 교권 침해 사건의 정보를 입력해주세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type */}
              <div className="space-y-2">
                <Label htmlFor="type">
                  신고 유형 <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  required
                >
                  <option value="">선택하세요</option>
                  <option value="parent">학부모 민원</option>
                  <option value="student">학생 폭력</option>
                  <option value="defamation">명예훼손</option>
                  <option value="other">기타</option>
                </Select>
              </div>

              {/* Incident Date */}
              <div className="space-y-2">
                <Label htmlFor="incident_date">
                  발생 일시 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="incident_date"
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, incident_date: e.target.value }))}
                  required
                />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  제목 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="신고 제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={200}
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  상황 설명 <span className="text-red-500">*</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    (최소 50자)
                  </span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="발생한 상황을 자세히 설명해주세요. 언제, 어디서, 누가, 무엇을, 어떻게 등의 정보를 포함해주시면 도움이 됩니다."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={8}
                  maxLength={5000}
                  required
                  className="resize-none"
                />
                <div className="text-xs text-muted-foreground text-right">
                  {formData.content.length} / 5000자
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="files">
                  증거 자료 첨부
                  <span className="text-sm text-muted-foreground ml-2">
                    (선택, 최대 5개, 각 10MB)
                  </span>
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm text-primary hover:underline">
                      파일을 선택하거나
                    </span>
                    <span className="text-sm text-muted-foreground"> 여기에 끌어다 놓으세요</span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.mp3,.m4a"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    지원 형식: 이미지, PDF, 문서, 음성 파일
                  </p>
                </div>

                {/* File List */}
                {formData.files.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {formData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          삭제
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <div className="flex space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">개인정보 보호 안내</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>신고 내용은 암호화되어 안전하게 보관됩니다</li>
                    <li>신원 정보는 철저히 보호되며 익명으로 처리됩니다</li>
                    <li>제출된 자료는 법적 검토 목적으로만 사용됩니다</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <div className="space-x-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => toast('임시 저장 기능은 준비중입니다')}
              >
                임시 저장
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? '제출 중...' : '제출하기'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}