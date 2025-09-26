'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  MessageCircle,
  FileCheck,
  Calendar,
  Timer,
  Activity
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

type ConsultationStatus =
  | 'pending'        // 배정 대기
  | 'assigned'       // 변호사 배정됨
  | 'in_progress'    // 상담 중
  | 'awaiting_response' // 변호사 응답 대기
  | 'completed'      // 완료
  | 'cancelled';     // 취소

interface ConsultationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  duration?: string;
  details?: string;
}

interface ConsultationProgressProps {
  status: ConsultationStatus;
  assignedAt?: string;
  startedAt?: string;
  respondedAt?: string;
  completedAt?: string;
  estimatedDuration?: number; // in hours
  actualDuration?: number;    // in hours
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  showTimeline?: boolean;
  variant?: 'detailed' | 'compact';
}

const statusConfig: Record<ConsultationStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  progress: number;
}> = {
  pending: {
    label: '배정 대기',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: <Clock className="h-4 w-4" />,
    progress: 0
  },
  assigned: {
    label: '변호사 배정됨',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: <UserCheck className="h-4 w-4" />,
    progress: 25
  },
  in_progress: {
    label: '상담 진행 중',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: <MessageCircle className="h-4 w-4" />,
    progress: 50
  },
  awaiting_response: {
    label: '변호사 응답 대기',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: <AlertCircle className="h-4 w-4" />,
    progress: 75
  },
  completed: {
    label: '상담 완료',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: <CheckCircle2 className="h-4 w-4" />,
    progress: 100
  },
  cancelled: {
    label: '상담 취소',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: <FileCheck className="h-4 w-4" />,
    progress: 0
  }
};

const priorityConfig = {
  low: { label: '일반', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  medium: { label: '보통', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  high: { label: '중요', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  urgent: { label: '긴급', color: 'text-red-600', bgColor: 'bg-red-100' }
};

export function ConsultationProgress({
  status,
  assignedAt,
  startedAt,
  respondedAt,
  completedAt,
  estimatedDuration,
  actualDuration,
  priority = 'medium',
  showTimeline = true,
  variant = 'detailed'
}: ConsultationProgressProps) {
  const currentStatus = statusConfig[status];

  const getSteps = (): ConsultationStep[] => {
    const steps: ConsultationStep[] = [
      {
        id: 'assigned',
        title: '변호사 배정',
        description: '담당 변호사가 배정되었습니다',
        icon: <UserCheck className="h-4 w-4" />,
        status: assignedAt ? 'completed' : (status === 'pending' ? 'current' : 'pending'),
        timestamp: assignedAt,
        details: assignedAt ? `${formatRelativeTime(assignedAt)} 배정됨` : undefined
      },
      {
        id: 'started',
        title: '상담 시작',
        description: '변호사가 상담을 시작했습니다',
        icon: <MessageCircle className="h-4 w-4" />,
        status: startedAt ? 'completed' :
                (status === 'assigned' ? 'current' :
                 ['in_progress', 'awaiting_response', 'completed'].includes(status) ? 'completed' : 'pending'),
        timestamp: startedAt,
        details: startedAt ? `${formatRelativeTime(startedAt)} 시작됨` : undefined
      },
      {
        id: 'response',
        title: '변호사 응답',
        description: '변호사의 상담 의견이 제공되었습니다',
        icon: <FileCheck className="h-4 w-4" />,
        status: respondedAt ? 'completed' :
                (status === 'awaiting_response' ? 'current' :
                 status === 'completed' ? 'completed' : 'pending'),
        timestamp: respondedAt,
        details: respondedAt ? `${formatRelativeTime(respondedAt)} 응답함` : undefined
      },
      {
        id: 'completed',
        title: '상담 완료',
        description: '모든 상담이 완료되었습니다',
        icon: <CheckCircle2 className="h-4 w-4" />,
        status: completedAt ? 'completed' : (status === 'completed' ? 'current' : 'pending'),
        timestamp: completedAt,
        details: completedAt ? `${formatRelativeTime(completedAt)} 완료됨` : undefined
      }
    ];

    return steps;
  };

  const calculateDuration = () => {
    if (actualDuration) {
      return `${actualDuration.toFixed(1)}시간`;
    }
    if (startedAt && (respondedAt || completedAt)) {
      const start = new Date(startedAt);
      const end = new Date(respondedAt || completedAt || Date.now());
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return `${hours.toFixed(1)}시간`;
    }
    if (estimatedDuration) {
      return `예상 ${estimatedDuration}시간`;
    }
    return null;
  };

  const duration = calculateDuration();

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-4">
          <div className={cn(
            'p-2 rounded-lg',
            currentStatus.bgColor,
            'dark:bg-opacity-20'
          )}>
            <div className={cn('flex items-center', currentStatus.color)}>
              {currentStatus.icon}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {currentStatus.label}
              </span>
              {priority !== 'medium' && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    priorityConfig[priority].color,
                    priorityConfig[priority].bgColor
                  )}
                >
                  {priorityConfig[priority].label}
                </Badge>
              )}
            </div>
            <Progress
              value={currentStatus.progress}
              className="w-32 h-2"
            />
          </div>
        </div>

        {duration && (
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {duration}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              소요시간
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-950/30">
      <CardHeader className="border-b border-blue-100 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xl text-gray-900 dark:text-gray-100">상담 진행 상황</span>
          </div>

          {priority !== 'medium' && (
            <Badge
              className={cn(
                'px-3 py-1',
                priorityConfig[priority].color,
                priorityConfig[priority].bgColor,
                'border-0'
              )}
            >
              {priorityConfig[priority].label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/30 rounded-xl">
            <div className="flex items-center space-x-4">
              <div className={cn(
                'p-3 rounded-xl shadow-sm',
                currentStatus.bgColor,
                'dark:bg-opacity-20'
              )}>
                <div className={cn('flex items-center', currentStatus.color)}>
                  {currentStatus.icon}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {currentStatus.label}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  현재 상태
                </p>
              </div>
            </div>

            <div className="text-right space-y-2">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {currentStatus.progress}%
              </div>
              <Progress
                value={currentStatus.progress}
                className="w-20 h-2"
              />
            </div>
          </div>

          {/* Duration Info */}
          {(duration || estimatedDuration) && (
            <div className="grid grid-cols-2 gap-4">
              {duration && (
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-2 mb-1">
                    <Timer className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      소요 시간
                    </span>
                  </div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-100">
                    {duration}
                  </div>
                </div>
              )}

              {estimatedDuration && !actualDuration && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      예상 시간
                    </span>
                  </div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {estimatedDuration}시간
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline Steps */}
          {showTimeline && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>진행 단계</span>
              </h4>

              <div className="space-y-4">
                {getSteps().map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4">
                    {/* Step Indicator */}
                    <div className="relative">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm',
                        step.status === 'completed'
                          ? 'bg-green-100 border-green-300 text-green-600 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400'
                          : step.status === 'current'
                          ? 'bg-blue-100 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400 animate-pulse'
                          : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500'
                      )}>
                        {step.icon}
                      </div>

                      {/* Connecting Line */}
                      {index < getSteps().length - 1 && (
                        <div className={cn(
                          'absolute top-10 left-1/2 transform -translate-x-px w-0.5 h-8',
                          step.status === 'completed'
                            ? 'bg-green-300 dark:bg-green-600'
                            : 'bg-gray-300 dark:bg-gray-600'
                        )} />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className={cn(
                          'font-semibold',
                          step.status === 'completed'
                            ? 'text-gray-900 dark:text-gray-100'
                            : step.status === 'current'
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-500 dark:text-gray-400'
                        )}>
                          {step.title}
                        </h5>

                        {step.timestamp && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(step.timestamp)}
                          </span>
                        )}
                      </div>

                      <p className={cn(
                        'text-sm mb-1',
                        step.status === 'completed'
                          ? 'text-gray-600 dark:text-gray-300'
                          : step.status === 'current'
                          ? 'text-blue-600 dark:text-blue-300'
                          : 'text-gray-400 dark:text-gray-500'
                      )}>
                        {step.description}
                      </p>

                      {step.details && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {step.details}
                        </p>
                      )}

                      {step.status === 'current' && step.id === 'assigned' && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded">
                          담당 변호사 검토 중...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}