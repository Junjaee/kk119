'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  CheckList,
  Scale,
  Clock,
  Star,
  User,
  Download,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Quote,
  AlertTriangle,
  Info
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface LawyerInfo {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  law_firm: string;
  experience_years?: number;
}

interface ConsultationResponse {
  id: string;
  consultation_content: string;
  recommended_actions?: string;
  legal_references?: string[];
  consultation_type?: 'initial' | 'follow_up' | 'final';
  priority_level?: number;
  estimated_duration?: number;
  actual_duration?: number;
  internal_notes?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

interface LawyerResponseProps {
  response: ConsultationResponse;
  lawyer: LawyerInfo;
  canRate?: boolean;
  currentRating?: number;
  onRate?: (rating: number) => void;
  showInternalNotes?: boolean;
  variant?: 'full' | 'compact';
}

const consultationTypeConfig = {
  initial: {
    label: '초기 상담',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300'
  },
  follow_up: {
    label: '추가 상담',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300'
  },
  final: {
    label: '최종 의견',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300'
  }
};

export function LawyerResponse({
  response,
  lawyer,
  canRate = false,
  currentRating,
  onRate,
  showInternalNotes = false,
  variant = 'full'
}: LawyerResponseProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const typeConfig = consultationTypeConfig[response.consultation_type || 'initial'];

  const renderRatingStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => onRate?.(i)}
          className={cn(
            'transition-colors duration-200',
            currentRating && i <= currentRating
              ? 'text-yellow-400 hover:text-yellow-500'
              : 'text-gray-300 hover:text-yellow-300',
            !onRate && 'cursor-default'
          )}
          disabled={!onRate}
        >
          <Star className={cn(
            'h-5 w-5',
            currentRating && i <= currentRating ? 'fill-current' : ''
          )} />
        </button>
      );
    }
    return stars;
  };

  if (variant === 'compact') {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200 dark:border-green-800 p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10 border-2 border-green-300 dark:border-green-600">
            <AvatarImage src="" alt={lawyer.name} />
            <AvatarFallback className="bg-green-600 text-white font-semibold text-sm">
              {getInitials(lawyer.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {lawyer.name}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    typeConfig.color,
                    typeConfig.bgColor,
                    typeConfig.borderColor
                  )}
                >
                  {typeConfig.label}
                </Badge>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatRelativeTime(response.created_at)}
              </span>
            </div>

            <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
              {response.consultation_content}
            </div>

            {response.recommended_actions && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-1 mb-1">
                  <CheckList className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    권장 조치
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed line-clamp-2">
                  {response.recommended_actions}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-green-950/30">
      <CardHeader className="border-b border-green-100 dark:border-green-900 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xl text-gray-900 dark:text-gray-100">변호사 상담 응답</span>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              className={cn(
                'px-3 py-1',
                typeConfig.color,
                typeConfig.bgColor,
                typeConfig.borderColor,
                'border'
              )}
            >
              {typeConfig.label}
            </Badge>
            {response.priority_level && response.priority_level > 3 && (
              <Badge variant="destructive" className="px-2 py-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                긴급
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Lawyer Info */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-800 dark:to-green-950/30 rounded-xl">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 border-2 border-green-300 dark:border-green-600">
                <AvatarImage src="" alt={lawyer.name} />
                <AvatarFallback className="bg-green-600 text-white font-semibold">
                  {getInitials(lawyer.name)}
                </AvatarFallback>
              </Avatar>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {lawyer.name}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{lawyer.law_firm}</span>
                  {lawyer.experience_years && (
                    <>
                      <span>•</span>
                      <span>경력 {lawyer.experience_years}년</span>
                    </>
                  )}
                </div>
                {lawyer.specialization && lawyer.specialization.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lawyer.specialization.slice(0, 3).map((spec, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600"
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                응답일시
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatDate(response.created_at)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatRelativeTime(response.created_at)}
              </div>
            </div>
          </div>

          {/* Main Consultation Content */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Quote className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                상담 내용
              </h4>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap mb-0">
                  {response.consultation_content}
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          {response.recommended_actions && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckList className="h-5 w-5 text-green-600" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  권장 조치사항
                </h4>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="text-blue-900 dark:text-blue-100 leading-relaxed whitespace-pre-wrap mb-0">
                    {response.recommended_actions}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Legal References */}
          {response.legal_references && response.legal_references.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Scale className="h-5 w-5 text-purple-600" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  관련 법적 근거
                </h4>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="space-y-3">
                  {response.legal_references.map((reference, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-purple-900 dark:text-purple-100 leading-relaxed">
                          {reference}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 h-8 px-3 text-xs border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        확인
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Internal Notes (Admin/Lawyer only) */}
          {showInternalNotes && response.internal_notes && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-orange-600" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  내부 메모
                </h4>
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
                  관리자 전용
                </Badge>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                <p className="text-orange-900 dark:text-orange-100 leading-relaxed whitespace-pre-wrap text-sm">
                  {response.internal_notes}
                </p>
              </div>
            </div>
          )}

          {/* Attachments */}
          {response.attachments && response.attachments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Download className="h-5 w-5 text-gray-600" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  첨부 자료
                </h4>
                <Badge variant="outline" className="text-xs">
                  {response.attachments.length}개
                </Badge>
              </div>

              <div className="grid gap-3">
                {response.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {attachment}
                    </span>
                    <Button size="sm" variant="outline" className="flex-shrink-0">
                      <Download className="h-4 w-4 mr-2" />
                      다운로드
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Footer with Duration and Rating */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              {response.actual_duration && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>소요시간: {response.actual_duration.toFixed(1)}시간</span>
                </div>
              )}

              {response.estimated_duration && !response.actual_duration && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>예상 소요시간: {response.estimated_duration}시간</span>
                </div>
              )}

              {response.updated_at !== response.created_at && (
                <div className="text-xs">
                  {formatRelativeTime(response.updated_at)} 수정됨
                </div>
              )}
            </div>

            {/* Rating */}
            {canRate && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  이 상담이 도움이 되었나요?
                </span>
                <div className="flex items-center space-x-1">
                  {renderRatingStars()}
                </div>
                {currentRating && (
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
                    {currentRating}/5
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}