import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Inbox } from 'lucide-react';

/**
 * EmptyState — 데이터가 없을 때 표시되는 표준 컴포넌트.
 * SPEC-UI-001 S2.
 *
 * 사용 예:
 *   <EmptyState
 *     icon={<FileX className="h-10 w-10" />}
 *     title="아직 작성된 상담이 없습니다"
 *     description="첫 번째 상담을 시작해보세요."
 *     action={<Button>새 상담 작성</Button>}
 *   />
 */

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** 컨테이너 최소 높이 */
  minHeight?: 'sm' | 'md' | 'lg';
}

const minHeightClasses = {
  sm: 'min-h-[200px]',
  md: 'min-h-[320px]',
  lg: 'min-h-[480px]',
};

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, minHeight = 'md', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center gap-4 text-center px-6 py-12',
          minHeightClasses[minHeight],
          className
        )}
        role="status"
        {...props}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
          aria-hidden="true"
        >
          {icon ?? <Inbox className="h-7 w-7" />}
        </div>
        <div className="flex flex-col gap-1.5 max-w-sm">
          <h3 className="text-h3 font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-small text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
