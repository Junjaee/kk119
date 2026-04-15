import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Skeleton — 로딩 상태 placeholder.
 * SPEC-UI-001 S1: 페이지 전환 시 로딩 표시, 컨텐츠 영역 shape 유지.
 *
 * 사용 예:
 *   <Skeleton className="h-4 w-48" />
 *   <Skeleton className="h-10 w-10 rounded-full" />
 *   <Skeleton variant="text" lines={3} />
 */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circle' | 'card';
  lines?: number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', lines = 1, ...props }, ref) => {
    if (variant === 'text' && lines > 1) {
      return (
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-4 rounded-sm bg-neutral-200 dark:bg-neutral-800 animate-pulse',
                i === lines - 1 && 'w-4/5'
              )}
            />
          ))}
        </div>
      );
    }

    const variantStyles = {
      default: 'h-4 w-full rounded-sm',
      text: 'h-4 w-full rounded-sm',
      circle: 'h-10 w-10 rounded-full',
      card: 'h-32 w-full rounded-md',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-neutral-200 dark:bg-neutral-800 animate-pulse',
          variantStyles[variant],
          className
        )}
        aria-hidden="true"
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };
