"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FileUpload, { UploadedFile } from "@/components/editor/FileUpload";
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  AlertTriangle,
  Info,
  Hash,
  FileText,
  Upload,
  BookOpen,
} from "lucide-react";

// Dynamically import the editor to avoid SSR issues
const RichTextEditor = dynamic(
  () => import("@/components/editor/RichTextEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] border rounded-lg bg-gray-50 dark:bg-gray-900 animate-pulse" />
    ),
  }
);

interface PostOptions {
  allow_comment: boolean;
  is_anonymous: boolean;
  is_notice: boolean;
}

const categories = [
  { value: "notice", label: "공지사항", icon: "📢" },
  { value: "teaching", label: "수업 자료", icon: "📚" },
  { value: "activity", label: "학급 활동", icon: "🎨" },
  { value: "management", label: "학급 경영", icon: "👥" },
  { value: "question", label: "질문/상담", icon: "💬" },
  { value: "info", label: "정보 공유", icon: "📋" },
  { value: "experience", label: "경험 나눔", icon: "✨" },
  { value: "daily", label: "일상/수다", icon: "☕" },
];

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [activeTab, setActiveTab] = useState("write");
  const [options, setOptions] = useState<PostOptions>({
    allow_comment: true,
    is_anonymous: false,
    is_notice: false,
  });

  const handleOptionChange = (key: keyof PostOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      const draftData = {
        title,
        content,
        category,
        attachments: files,
        options,
      };
      localStorage.setItem("community_draft", JSON.stringify(draftData));
      alert("임시 저장되었습니다.");
    } catch (error) {
      console.error("Failed to save draft:", error);
      alert("임시 저장에 실패했습니다.");
    } finally {
      setIsSavingDraft(false);
    }
  }, [title, content, category, files, options]);

  const handleLoadDraft = useCallback(() => {
    const savedDraft = localStorage.getItem("community_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setTitle(draft.title || "");
        setContent(draft.content || "");
        setCategory(draft.category || "");
        setFiles(draft.attachments || []);
        setOptions(draft.options || {
          allow_comment: true,
          is_anonymous: false,
          is_notice: false,
        });
        alert("임시 저장된 글을 불러왔습니다.");
      } catch (error) {
        console.error("Failed to load draft:", error);
        alert("임시 저장된 글을 불러오는데 실패했습니다.");
      }
    } else {
      alert("임시 저장된 글이 없습니다.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) {
      alert("카테고리를 선택해주세요.");
      return;
    }
    
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    
    if (!content.trim() || content === "<p></p>") {
      alert("내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
          category,
          attachments: files,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      const data = await response.json();
      
      // Clear draft after successful submission
      localStorage.removeItem("community_draft");
      
      router.push(`/community/${data.id}`);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("글 작성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    setActiveTab("preview");
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                돌아가기
              </Button>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <BookOpen className="h-8 w-8" />
                커뮤니티 글쓰기
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                초등교사 선생님들과 교육 현장의 경험을 공유해보세요
              </p>
            </div>

            {/* Notice */}
            <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Info className="h-4 w-4" />
              <AlertDescription className="space-y-1">
                <p className="font-semibold">글 작성 가이드라인</p>
                <ul className="text-sm space-y-1 mt-2">
                  <li>• 교육 현장의 실제 경험과 노하우를 공유해주세요</li>
                  <li>• 학생들의 개인정보가 노출되지 않도록 주의해주세요</li>
                  <li>• 건설적이고 서로 존중하는 소통 문화를 만들어주세요</li>
                  <li>• 수업 자료 공유 시 저작권을 확인해주세요</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category and Title */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        카테고리 <span className="text-red-500">*</span>
                      </Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                {cat.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="title" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        제목 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="제목을 입력하세요 (최대 90자)"
                        required
                        maxLength={90}
                        className="text-lg"
                      />
                      <p className="text-xs text-gray-500">
                        {title.length}/90
                      </p>
                    </div>
                  </div>

                  {/* Editor Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="write">작성</TabsTrigger>
                      <TabsTrigger value="preview">미리보기</TabsTrigger>
                    </TabsList>

                    <TabsContent value="write" className="space-y-4">
                      {/* Rich Text Editor */}
                      <div className="space-y-2">
                        <Label>내용 <span className="text-red-500">*</span></Label>
                        <RichTextEditor
                          content={content}
                          onChange={setContent}
                          placeholder="내용을 입력하세요..."
                        />
                      </div>

                      {/* File Upload */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Upload className="h-3 w-3" />
                          파일 첨부
                        </Label>
                        <FileUpload
                          onFilesChange={setFiles}
                          maxSize={50}
                          maxFiles={10}
                          accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.hwp,.txt"
                        />
                        <p className="text-xs text-gray-500">
                          수업 자료, 활동 사진, 문서 파일 등을 첨부할 수 있습니다 (최대 50MB, 10개)
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="preview">
                      <div className="prose prose-sm max-w-none p-4 bg-white dark:bg-gray-900 rounded-lg h-[500px] overflow-y-auto">
                        <h1>{title || "제목 없음"}</h1>
                        <div className="flex gap-2 mb-4">
                          <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                            {categories.find((c) => c.value === category)?.label || "미분류"}
                          </span>
                        </div>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: content || "<p>내용이 없습니다.</p>",
                          }}
                        />
                        {files.length > 0 && (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
                            <p className="font-semibold mb-2">첨부 파일:</p>
                            <ul className="space-y-1">
                              {files.map((file) => (
                                <li key={file.id} className="text-sm">
                                  📎 {file.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Options */}
                  <div className="space-y-4">
                    <Label>글 옵션</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allow_comment"
                          checked={options.allow_comment}
                          onCheckedChange={() => handleOptionChange("allow_comment")}
                        />
                        <label
                          htmlFor="allow_comment"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          댓글 허용
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_anonymous"
                          checked={options.is_anonymous}
                          onCheckedChange={() => handleOptionChange("is_anonymous")}
                        />
                        <label
                          htmlFor="is_anonymous"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          익명으로 작성
                        </label>
                      </div>

                      {category === "notice" && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_notice"
                            checked={options.is_notice}
                            onCheckedChange={() => handleOptionChange("is_notice")}
                          />
                          <label
                            htmlFor="is_notice"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            상단 고정
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={isSavingDraft || isSubmitting}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSavingDraft ? "저장 중..." : "임시 저장"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLoadDraft}
                      disabled={isSavingDraft || isSubmitting}
                    >
                      불러오기
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreview}
                      disabled={isSubmitting}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      미리보기
                    </Button>
                    <div className="flex-1" />
                    <Button
                      type="submit"
                      disabled={isSubmitting || !title || !content || !category}
                      className="sm:min-w-[120px]"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmitting ? "등록 중..." : "등록"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Alert className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-1">주의사항</p>
                <ul className="text-sm space-y-1">
                  <li>• 학생 사진 업로드 시 얼굴이 나오지 않도록 주의해주세요</li>
                  <li>• 학부모 민원이나 특정인을 비방하는 내용은 삼가해주세요</li>
                  <li>• 저작권이 있는 자료는 출처를 명시해주세요</li>
                  <li>• 부적절한 내용은 관리자에 의해 삭제될 수 있습니다</li>
                </ul>
              </AlertDescription>
            </Alert>
      </div>
    </DashboardLayout>
  );
}