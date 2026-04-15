'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

/**
 * ErrorState — 에러 발생 시 표시되는 표준 컴포넌트.
 * SPEC-UI-001 S3.
 *
 * 사용 예:
 *   <ErrorState
 *     title="데이터를 불러올 수 없습니다"
 *     description="네트워크 연결을 확인하고 다시 시도해 주세요."
 *     onRetry={() => refetch()}
 *   />
 */

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** 재시도 핸들러 — 있으면 기본 재시도 버튼이 렌더링됨 */
  onRetry?: () => void;
  /** 재시도 버튼 라벨 (기본: "다시 시도") */
  retryLabel?: string;
  /** 커스텀 action (onRetry보다 우선) */
  action?: React.ReactNode;
  minHeight?: 'sm' | 'md' | 'lg';
}

const minHeightClasses = {
  sm: 'min-h-[200px]',
  md: 'min-h-[320px]',
  lg: 'min-h-[480px]',
};

const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      icon,
      title = '문제가 발생했습니다',
      description = '일시적인 오류입니다. 잠시 후 다시 시도해 주세요.',
      onRetry,
      retryLabel = '다시 시도',
      action,
      minHeight = 'md',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center gap-4 text-center px-6 py-12',
          minHeightClasses[minHeight],
          className
        )}
        role="alert"
        {...props}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full bg-error-50 dark:bg-error-950/50 text-error-600 dark:text-error-400"
          aria-hidden="true"
        >
          {icon ?? <AlertTriangle className="h-7 w-7" />}
        </div>
        <div className="flex flex-col gap-1.5 max-w-sm">
          <h3 className="text-h3 font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-small text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action ? (
          <div className="mt-2">{action}</div>
        ) : onRetry ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </Button>
        ) : null}
      </div>
    );
  }
);
ErrorState.displayName = 'ErrorState';

export { ErrorState };
