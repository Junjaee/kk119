'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Send,
  Paperclip,
  Upload,
  X,
  File,
  Image,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare2,
  Plus,
  Trash2
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress?: number;
  uploadStatus?: 'uploading' | 'completed' | 'error';
  url?: string;
}

interface SubmittedInquiry {
  id: string;
  question: string;
  attachments?: AttachedFile[];
  submitted_at: string;
  status: 'pending' | 'acknowledged' | 'responded';
  lawyer_response?: string;
  response_at?: string;
}

interface AdditionalInquiryProps {
  reportId: string;
  consultationId?: string;
  previousInquiries?: SubmittedInquiry[];
  onSubmit: (question: string, files: File[]) => Promise<void>;
  onDeleteInquiry?: (inquiryId: string) => Promise<void>;
  disabled?: boolean;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  allowedFileTypes?: string[];
}

const statusConfig = {
  pending: {
    label: '검토 대기',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: <Clock className="h-4 w-4" />
  },
  acknowledged: {
    label: '검토 중',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: <AlertCircle className="h-4 w-4" />
  },
  responded: {
    label: '답변 완료',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: <CheckCircle2 className="h-4 w-4" />
  }
};

export function AdditionalInquiry({
  reportId,
  consultationId,
  previousInquiries = [],
  onSubmit,
  onDeleteInquiry,
  disabled = false,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  allowedFileTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
}: AdditionalInquiryProps) {
  const [question, setQuestion] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviousInquiries, setShowPreviousInquiries] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-green-600" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-600" />;
    } else if (
      fileType === 'application/msword' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return <FileText className="h-4 w-4 text-blue-600" />;
    }
    return <File className="h-4 w-4 text-gray-600" />;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: AttachedFile[] = [];

    Array.from(files).forEach((file) => {
      // Check file size
      if (file.size > maxFileSize) {
        toast.error(`파일 크기가 너무 큽니다: ${file.name} (최대 ${formatFileSize(maxFileSize)})`);
        return;
      }

      // Check file type
      if (!allowedFileTypes.includes(file.type)) {
        toast.error(`지원하지 않는 파일 형식입니다: ${file.name}`);
        return;
      }

      // Check total number of files
      if (attachedFiles.length + newFiles.length >= maxFiles) {
        toast.error(`최대 ${maxFiles}개의 파일만 첨부할 수 있습니다.`);
        return;
      }

      newFiles.push({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 0,
        uploadStatus: 'uploading'
      });
    });

    setAttachedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((file, index) => {
      setTimeout(() => {
        const interval = setInterval(() => {
          setAttachedFiles(prev =>
            prev.map(f =>
              f.id === file.id
                ? {
                    ...f,
                    uploadProgress: Math.min((f.uploadProgress || 0) + 10, 100),
                    uploadStatus: (f.uploadProgress || 0) + 10 >= 100 ? 'completed' : 'uploading'
                  }
                : f
            )
          );
        }, 100);

        setTimeout(() => {
          clearInterval(interval);
        }, 1000);
      }, index * 200);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast.error('질문을 입력해주세요.');
      return;
    }

    if (attachedFiles.some(f => f.uploadStatus === 'uploading')) {
      toast.error('파일 업로드가 완료될 때까지 기다려주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert AttachedFile to File objects (this is a mock - in real implementation,
      // you would need to keep references to the original File objects)
      const files: File[] = []; // In real implementation, maintain File references

      await onSubmit(question, files);

      // Reset form
      setQuestion('');
      setAttachedFiles([]);
      toast.success('질문이 성공적으로 제출되었습니다.');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('질문 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    if (!onDeleteInquiry) return;

    try {
      await onDeleteInquiry(inquiryId);
      toast.success('질문이 삭제되었습니다.');
    } catch (error) {
      console.error('Delete inquiry error:', error);
      toast.error('질문 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Previous Inquiries */}
      {previousInquiries.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <MessageSquare2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="text-lg">이전 질문</span>
                <Badge variant="outline" className="ml-2">
                  {previousInquiries.length}개
                </Badge>
              </CardTitle>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreviousInquiries(!showPreviousInquiries)}
              >
                {showPreviousInquiries ? '숨기기' : '보기'}
              </Button>
            </div>
          </CardHeader>

          {showPreviousInquiries && (
            <CardContent className="p-6">
              <div className="space-y-4">
                {previousInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={cn(
                            'px-2 py-1 text-xs',
                            statusConfig[inquiry.status].color,
                            statusConfig[inquiry.status].bgColor
                          )}
                        >
                          <span className="mr-1">
                            {statusConfig[inquiry.status].icon}
                          </span>
                          {statusConfig[inquiry.status].label}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(inquiry.submitted_at)}
                        </span>
                      </div>

                      {onDeleteInquiry && inquiry.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInquiry(inquiry.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {inquiry.question}
                      </p>
                    </div>

                    {inquiry.attachments && inquiry.attachments.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          첨부 파일 ({inquiry.attachments.length}개)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {inquiry.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg text-xs"
                            >
                              {getFileIcon(attachment.type)}
                              <span className="truncate max-w-32">{attachment.name}</span>
                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {inquiry.lawyer_response && (
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                        <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-2 flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>변호사 답변</span>
                          {inquiry.response_at && (
                            <span className="text-gray-500 dark:text-gray-400">
                              • {formatRelativeTime(inquiry.response_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed whitespace-pre-wrap bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                          {inquiry.lawyer_response}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* New Inquiry Form */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-950/30">
        <CardHeader className="border-b border-blue-100 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xl text-gray-900 dark:text-gray-100">추가 질문하기</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Question Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                질문 내용
              </label>
              <Textarea
                placeholder="변호사에게 추가로 궁금한 점을 자세히 적어주세요..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={disabled || isSubmitting}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-between mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  상세하고 구체적인 질문일수록 더 정확한 답변을 받을 수 있습니다.
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {question.length}/1000
                </span>
              </div>
            </div>

            {/* File Attachment */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  자료 첨부
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isSubmitting || attachedFiles.length >= maxFiles}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  파일 선택
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                accept={allowedFileTypes.join(',')}
                className="hidden"
              />

              <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                최대 {maxFiles}개, 파일당 최대 {formatFileSize(maxFileSize)}
                (이미지, PDF, 문서 파일 지원)
              </div>

              {/* Attached Files */}
              {attachedFiles.length > 0 && (
                <div className="space-y-2">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                          </div>
                          {file.uploadStatus === 'uploading' && (
                            <Progress
                              value={file.uploadProgress || 0}
                              className="h-1 mt-1"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {file.uploadStatus === 'completed' && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          disabled={isSubmitting}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button
                onClick={handleSubmit}
                disabled={disabled || isSubmitting || !question.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    전송 중...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    질문 제출
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}