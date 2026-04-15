import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * PageHeader — 페이지 상단 타이틀 + description + actions 슬롯.
 * SPEC-UI-001 M5. 모든 도메인 페이지의 상단 히어로 영역 표준화용.
 *
 * 사용 예:
 *   <PageHeader
 *     title="상담 내역"
 *     description="지난 30일간의 상담 기록입니다."
 *     actions={<Button>새 상담 작성</Button>}
 *   />
 */

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** 상단 여백 제거 (내부 nested 사용 시) */
  dense?: boolean;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, actions, dense = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-4 border-b border-border pb-6',
          !dense && 'pt-2',
          'sm:flex-row sm:items-center sm:justify-between',
          className
        )}
        {...props}
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          {typeof title === 'string' ? (
            <h1 className="text-h1 font-bold tracking-tight text-foreground truncate">
              {title}
            </h1>
          ) : (
            title
          )}
          {description && (
            <p className="text-small text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    );
  }
);
PageHeader.displayName = 'PageHeader';

export { PageHeader };
