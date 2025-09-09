"use client";

import { useState, useCallback } from "react";
import { Upload, X, File, Image, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFilesChange?: (files: UploadedFile[]) => void;
  maxSize?: number; // MB
  maxFiles?: number;
  accept?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress?: number;
  error?: string;
}

export default function FileUpload({
  onFilesChange,
  maxSize = 50,
  maxFiles = 20,
  accept = "image/*,video/*,.pdf,.doc,.docx,.txt",
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    },
    [files, maxFiles, maxSize]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        handleFiles(selectedFiles);
      }
    },
    [files, maxFiles, maxSize]
  );

  const handleFiles = async (newFiles: File[]) => {
    // Check file count
    if (files.length + newFiles.length > maxFiles) {
      alert(`최대 ${maxFiles}개까지 업로드 가능합니다.`);
      return;
    }

    // Process files
    const processedFiles: UploadedFile[] = [];
    
    for (const file of newFiles) {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`${file.name}은 ${maxSize}MB를 초과합니다.`);
        continue;
      }

      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
      };

      processedFiles.push(uploadedFile);
    }

    if (processedFiles.length > 0) {
      setFiles((prev) => [...prev, ...processedFiles]);
      setUploading(true);

      // Simulate upload progress
      for (const file of processedFiles) {
        await simulateUpload(file);
      }

      setUploading(false);
      onFilesChange?.(files);
    }
  };

  const simulateUpload = async (file: UploadedFile) => {
    // In real implementation, this would be actual upload to server
    return new Promise<void>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, progress } : f
          )
        );
        if (progress >= 100) {
          clearInterval(interval);
          // Set fake URL after upload
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, url: `/uploads/${file.name}`, progress: 100 }
                : f
            )
          );
          resolve();
        }
      }, 200);
    });
  };

  const removeFile = useCallback(
    (fileId: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      onFilesChange?.(files.filter((f) => f.id !== fileId));
    },
    [files, onFilesChange]
  );

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (type.startsWith("video/")) return <Video className="h-4 w-4" />;
    if (type.includes("pdf")) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-gray-300 dark:border-gray-700",
          uploading && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          disabled={uploading}
        />
        
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <label
              htmlFor="file-upload"
              className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
            >
              파일을 선택
            </label>
            하거나 여기에 드래그하세요
          </p>
          <p className="text-xs text-gray-500 mt-1">
            최대 {maxSize}MB, {maxFiles}개까지 업로드 가능
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {files.length}개 파일 ({formatFileSize(files.reduce((acc, f) => acc + f.size, 0))})
            </span>
            {files.length > 0 && !uploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFiles([]);
                  onFilesChange?.([]);
                }}
              >
                모두 삭제
              </Button>
            )}
          </div>
          
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1">
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  {file.progress !== undefined && file.progress < 100 && (
                    <Progress value={file.progress} className="mt-1 h-1" />
                  )}
                </div>
              </div>
              {file.progress === 100 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}