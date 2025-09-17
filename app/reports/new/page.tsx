'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useStore } from '@/lib/store';
import { 
  FileText, 
  Upload, 
  AlertCircle, 
  Info,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Shield,
  Clock,
  X,
  AlertTriangle,
  HelpCircle,
  MapPin,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { localDB } from '@/lib/services/localDB';

// Step indicator component
const StepIndicator = ({ currentStep, steps }: { currentStep: number; steps: string[] }) => {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex-1 relative">
            <div className="flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
                index < currentStep 
                  ? "bg-green-500 text-white" 
                  : index === currentStep
                    ? "bg-primary text-white animate-pulse"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              )}>
                {index < currentStep ? <CheckCircle2 className="h-6 w-6" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-1 mx-2 transition-all duration-300",
                  index < currentStep 
                    ? "bg-green-500" 
                    : "bg-gray-200 dark:bg-gray-700"
                )} />
              )}
            </div>
            <p className={cn(
              "text-xs mt-2 font-medium transition-colors",
              index <= currentStep 
                ? "text-foreground" 
                : "text-muted-foreground"
            )}>
              {step}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Tooltip component
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg max-w-xs">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};

function NewReportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useStore();
  const editId = searchParams.get('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    incident_date: formatDate(new Date(), 'YYYY-MM-DD'),
    incident_time: '',
    location: '',
    witnesses: '',
    content: '',
    desired_action: '',
    files: [] as File[]
  });

  const steps = ['기본 정보', '사건 상세', '증거 자료', '확인 및 제출'];

  // Load existing data for editing
  useEffect(() => {
    if (editId) {
      const existingReport = localDB.getReportById(editId);
      if (existingReport) {
        setFormData({
          type: existingReport.type,
          title: existingReport.title,
          incident_date: existingReport.incident_date,
          incident_time: existingReport.incident_time,
          location: existingReport.location,
          witnesses: existingReport.witnesses || '',
          content: existingReport.content,
          desired_action: existingReport.desired_action || '',
          files: [] // Reset files for editing
        });
      }
    }
  }, [editId]);

  // Calculate form completion percentage
  const calculateProgress = () => {
    const fields = ['type', 'title', 'incident_date', 'incident_time', 'location', 'content'];
    const filledFields = fields.filter(field => formData[field as keyof typeof formData]);
    return Math.round((filledFields.length / fields.length) * 100);
  };

  // Validate current step
  const validateStep = (step: number) => {
    const errors: { [key: string]: string } = {};

    switch(step) {
      case 0:
        if (!formData.type) errors.type = '신고 유형을 선택해주세요';
        if (!formData.incident_date) errors.incident_date = '발생 일시를 입력해주세요';
        if (!formData.incident_time) errors.incident_time = '발생 시간을 입력해주세요';
        if (!formData.location) errors.location = '발생 장소를 입력해주세요';
        break;
      case 1:
        if (!formData.title) errors.title = '제목을 입력해주세요';
        if (!formData.content) errors.content = '상황 설명을 입력해주세요';
        if (formData.content && formData.content.length < 50) {
          errors.content = '상황 설명은 최소 50자 이상 입력해주세요';
        }
        break;
      case 2:
        // No validation for evidence step - optional fields
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('필수 항목을 모두 입력해주세요');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only allow submission from the final step
    if (currentStep !== steps.length - 1) {
      toast.error('마지막 단계에서만 제출이 가능합니다');
      return;
    }
    
    // Validate all steps
    let isValid = true;
    for (let i = 0; i <= 1; i++) {
      if (!validateStep(i)) {
        isValid = false;
        setCurrentStep(i);
        break;
      }
    }

    if (!isValid) {
      toast.error('필수 항목을 모두 입력해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save report to local database
      const reportData = {
        type: formData.type,
        title: formData.title,
        incident_date: formData.incident_date,
        incident_time: formData.incident_time,
        location: formData.location,
        witnesses: formData.witnesses,
        content: formData.content,
        desired_action: formData.desired_action,
        fileNames: formData.files.map(file => file.name) // Store only file names
      };

      const savedReport = editId
        ? localDB.updateReport(editId, reportData)
        : localDB.createReport(reportData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear draft after successful submission
      localStorage.removeItem('reportDraft');
      
      toast.success(editId ? '신고 내역이 성공적으로 수정되었습니다' : '신고가 성공적으로 접수되었습니다');
      router.push('/reports');
    } catch (error) {
      toast.error(editId ? '신고 수정 중 오류가 발생했습니다' : '신고 접수 중 오류가 발생했습니다');
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

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title || formData.content) {
        localStorage.setItem('reportDraft', JSON.stringify(formData));
        toast('임시 저장되었습니다', { icon: '💾', duration: 1000 });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('reportDraft');
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      setFormData(prev => ({ ...prev, ...parsedDraft, files: [] }));
      toast('이전에 작성하던 내용을 불러왔습니다', { icon: '📝' });
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header with progress */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary rounded-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {editId ? '신고 내역 수정' : '교권 침해 신고하기'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {editId ? '기존 신고 내역을 수정할 수 있습니다' : '신고 내용은 철저히 보호되며, 전문가가 검토합니다'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{calculateProgress()}%</div>
              <div className="text-xs text-muted-foreground">작성 완료</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={steps} />

        {/* Form */}
        <div className="space-y-6">
          {/* Step 0: Basic Information */}
          {currentStep === 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-primary" />
                  <span>기본 정보</span>
                </CardTitle>
                <CardDescription>
                  사건의 기본적인 정보를 입력해주세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Report Type */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="flex items-center space-x-2">
                    <span>신고 유형</span>
                    <span className="text-red-500">*</span>
                    <Tooltip content="발생한 교권 침해의 유형을 선택해주세요">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </Tooltip>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger
                      className={cn(
                        "w-full",
                        formErrors.type && "border-red-500 focus:ring-red-500"
                      )}
                    >
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">학부모 민원</SelectItem>
                      <SelectItem value="student">학생 폭력</SelectItem>
                      <SelectItem value="verbal">욕설 및 폭언</SelectItem>
                      <SelectItem value="defamation">명예훼손</SelectItem>
                      <SelectItem value="harassment">성희롱</SelectItem>
                      <SelectItem value="threat">협박</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.type && (
                    <p className="text-sm text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {formErrors.type}
                    </p>
                  )}
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="incident_date" className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>발생 일자</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="incident_date"
                      type="date"
                      value={formData.incident_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, incident_date: e.target.value }))}
                      max={formatDate(new Date(), 'YYYY-MM-DD')}
                      className={cn(
                        formErrors.incident_date && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {formErrors.incident_date && (
                      <p className="text-sm text-red-500">{formErrors.incident_date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incident_time" className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>발생 시간</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="incident_time"
                      type="time"
                      value={formData.incident_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, incident_time: e.target.value }))}
                      className={cn(
                        formErrors.incident_time && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {formErrors.incident_time && (
                      <p className="text-sm text-red-500">{formErrors.incident_time}</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>발생 장소</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="예: 3학년 2반 교실, 교무실, 운동장 등"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className={cn(
                      formErrors.location && "border-red-500 focus:ring-red-500"
                    )}
                  />
                  {formErrors.location && (
                    <p className="text-sm text-red-500">{formErrors.location}</p>
                  )}
                </div>

                {/* Witnesses */}
                <div className="space-y-2">
                  <Label htmlFor="witnesses" className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>목격자</span>
                    <span className="text-sm text-muted-foreground ml-2">(선택)</span>
                  </Label>
                  <Input
                    id="witnesses"
                    placeholder="목격자가 있다면 입력해주세요"
                    value={formData.witnesses}
                    onChange={(e) => setFormData(prev => ({ ...prev, witnesses: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    목격자 정보는 사실 확인을 위해서만 사용되며, 철저히 보호됩니다
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Incident Details */}
          {currentStep === 1 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>사건 상세</span>
                </CardTitle>
                <CardDescription>
                  발생한 사건을 자세히 설명해주세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    className={cn(
                      formErrors.title && "border-red-500 focus:ring-red-500"
                    )}
                  />
                  {formErrors.title && (
                    <p className="text-sm text-red-500">{formErrors.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.title.length}/200자
                  </p>
                </div>

                {/* Content with guidance */}
                <div className="space-y-2">
                  <Label htmlFor="content">
                    상황 설명 <span className="text-red-500">*</span>
                    <span className="text-sm text-muted-foreground ml-2">(최소 50자)</span>
                  </Label>
                  
                  {/* Writing guide */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      작성 가이드
                    </h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• <strong>언제:</strong> 정확한 날짜와 시간</li>
                      <li>• <strong>어디서:</strong> 구체적인 장소</li>
                      <li>• <strong>누가:</strong> 관련된 사람들 (익명 가능)</li>
                      <li>• <strong>무엇을:</strong> 발생한 사건의 내용</li>
                      <li>• <strong>어떻게:</strong> 사건의 경위와 전개 과정</li>
                      <li>• <strong>결과:</strong> 사건으로 인한 피해나 영향</li>
                    </ul>
                  </div>

                  <Textarea
                    id="content"
                    placeholder="발생한 상황을 자세히 설명해주세요..."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={10}
                    maxLength={5000}
                    className={cn(
                      "resize-none",
                      formErrors.content && "border-red-500 focus:ring-red-500"
                    )}
                  />
                  {formErrors.content && (
                    <p className="text-sm text-red-500">{formErrors.content}</p>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {formData.content.length < 50 && (
                        <span className="text-orange-500">
                          최소 {50 - formData.content.length}자 더 입력해주세요
                        </span>
                      )}
                    </span>
                    <span>{formData.content.length}/5000자</span>
                  </div>
                </div>

                {/* Desired Action */}
                <div className="space-y-2">
                  <Label htmlFor="desired_action">
                    희망하는 조치사항
                    <span className="text-sm text-muted-foreground ml-2">(선택)</span>
                  </Label>
                  <Textarea
                    id="desired_action"
                    placeholder="이 사건과 관련하여 어떤 조치를 희망하시는지 입력해주세요"
                    value={formData.desired_action}
                    onChange={(e) => setFormData(prev => ({ ...prev, desired_action: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Evidence */}
          {currentStep === 2 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <span>증거 자료</span>
                </CardTitle>
                <CardDescription>
                  관련 증거 자료를 첨부해주세요 (선택사항)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-primary/5"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto text-primary/50 mb-4" />
                    <p className="text-sm font-medium mb-1">
                      클릭하거나 파일을 드래그하여 업로드
                    </p>
                    <p className="text-xs text-muted-foreground">
                      최대 5개, 각 10MB까지 | 이미지, PDF, 문서, 음성 파일 지원
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.mp3,.m4a"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* File List */}
                  {formData.files.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">첨부된 파일 ({formData.files.length}/5)</p>
                      {formData.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg group hover:bg-secondary/70 transition-colors">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review and Submit */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>확인 및 제출</span>
                  </CardTitle>
                  <CardDescription>
                    작성하신 내용을 확인하고 제출해주세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-secondary/30 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">신고 유형</p>
                        <p className="font-medium">
                          {formData.type === 'parent' ? '학부모 민원' :
                           formData.type === 'student' ? '학생 폭력' :
                           formData.type === 'verbal' ? '욕설 및 폭언' :
                           formData.type === 'defamation' ? '명예훼손' :
                           formData.type === 'harassment' ? '성희롱' :
                           formData.type === 'threat' ? '협박' : '기타'}
                        </p>
                      </div>
                      <div className="bg-secondary/30 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">발생 일시</p>
                        <p className="font-medium">
                          {formData.incident_date} {formData.incident_time}
                        </p>
                      </div>
                      <div className="bg-secondary/30 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">발생 장소</p>
                        <p className="font-medium">{formData.location || '미입력'}</p>
                      </div>
                      <div className="bg-secondary/30 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">목격자</p>
                        <p className="font-medium">{formData.witnesses || '없음'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-secondary/30 p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">제목</p>
                      <p className="font-medium">{formData.title}</p>
                    </div>
                    
                    <div className="bg-secondary/30 p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">상황 설명</p>
                      <p className="text-sm whitespace-pre-wrap">{formData.content}</p>
                    </div>

                    {formData.desired_action && (
                      <div className="bg-secondary/30 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">희망 조치사항</p>
                        <p className="text-sm whitespace-pre-wrap">{formData.desired_action}</p>
                      </div>
                    )}

                    {formData.files.length > 0 && (
                      <div className="bg-secondary/30 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">첨부 파일</p>
                        <p className="font-medium">{formData.files.length}개의 파일 첨부됨</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Privacy and Terms */}
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-900">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold mb-2">개인정보 보호 및 처리 안내</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li className="flex items-start">
                            <CheckCircle2 className="h-3 w-3 mr-2 mt-0.5 text-green-500" />
                            <span>모든 신고 내용은 암호화되어 안전하게 보관됩니다</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-3 w-3 mr-2 mt-0.5 text-green-500" />
                            <span>신원 정보는 관련 법령에 따라 철저히 보호됩니다</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-3 w-3 mr-2 mt-0.5 text-green-500" />
                            <span>제출된 자료는 법적 검토 및 지원 목적으로만 사용됩니다</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-3 w-3 mr-2 mt-0.5 text-green-500" />
                            <span>전문 변호사가 24시간 이내 검토 후 연락드립니다</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold mb-2">주의사항</p>
                        <p className="text-muted-foreground">
                          허위 신고 시 법적 책임이 따를 수 있으며, 사실과 다른 내용을 신고할 경우 
                          민·형사상 불이익을 받을 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                  className="flex items-center"
                >
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  이전 단계
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                취소
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => {
                  localStorage.setItem('reportDraft', JSON.stringify(formData));
                  toast.success('임시 저장되었습니다');
                }}
              >
                임시 저장
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="min-w-[120px] flex items-center"
                >
                  다음 단계
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                  disabled={isSubmitting}
                  className="min-w-[120px] bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {editId ? '수정 중...' : '제출 중...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {editId ? '수정하기' : '제출하기'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function NewReportPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    }>
      <NewReportPageContent />
    </Suspense>
  );
}