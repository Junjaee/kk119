import * as React from 'react';
import { cn } from '@/lib/utils/cn';

// @MX:NOTE: [AUTO] Badge variant 시스템 — 토큰 기반 + SPEC-UI-001 status variants 추가 (pending/in-progress/completed/urgent).

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    // Legacy alias
    | 'protection'
    | 'urgent'
    | 'trust'
    // SPEC-UI-001 status variants (S4)
    | 'pending'
    | 'in-progress'
    | 'completed';
  size?: 'sm' | 'default' | 'lg';
  dot?: boolean;
  pulse?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', dot = false, pulse = false, children, ...props }, ref) => {
    const variantStyles = {
      default:
        'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/40 dark:text-primary-200 dark:border-primary-800',
      primary:
        'bg-primary-500 text-white border border-transparent',
      secondary:
        'bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
      outline:
        'border border-border bg-transparent text-foreground',
      // Semantic
      success:
        'bg-success-50 text-success-700 border border-success-200 dark:bg-success-950/50 dark:text-success-300 dark:border-success-800',
      warning:
        'bg-warning-50 text-warning-800 border border-warning-200 dark:bg-warning-950/50 dark:text-warning-300 dark:border-warning-800',
      error:
        'bg-error-50 text-error-700 border border-error-200 dark:bg-error-950/50 dark:text-error-300 dark:border-error-800',
      info:
        'bg-info-50 text-info-700 border border-info-200 dark:bg-info-950/50 dark:text-info-300 dark:border-info-800',
      // Legacy alias
      protection:
        'bg-info-50 text-info-700 border border-info-200 dark:bg-info-950/50 dark:text-info-300 dark:border-info-800',
      urgent:
        'bg-error-50 text-error-700 border border-error-200 dark:bg-error-950/50 dark:text-error-300 dark:border-error-800',
      trust:
        'bg-success-50 text-success-700 border border-success-200 dark:bg-success-950/50 dark:text-success-300 dark:border-success-800',
      // Status variants (SPEC-UI-001 S4)
      pending:
        'bg-warning-50 text-warning-800 border border-warning-200 dark:bg-warning-950/50 dark:text-warning-300 dark:border-warning-800',
      'in-progress':
        'bg-info-50 text-info-700 border border-info-200 dark:bg-info-950/50 dark:text-info-300 dark:border-info-800',
      completed:
        'bg-success-50 text-success-700 border border-success-200 dark:bg-success-950/50 dark:text-success-300 dark:border-success-800',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-caption h-5',
      default: 'px-2.5 py-0.5 text-caption h-6',
      lg: 'px-3 py-1 text-small h-7',
    };

    const dotColorMap: Record<string, string> = {
      default: 'bg-primary-500',
      primary: 'bg-white',
      secondary: 'bg-neutral-500',
      outline: 'bg-neutral-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      info: 'bg-info-500',
      protection: 'bg-info-500',
      urgent: 'bg-error-500',
      trust: 'bg-success-500',
      pending: 'bg-warning-500',
      'in-progress': 'bg-info-500',
      completed: 'bg-success-500',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
          variantStyles[variant],
          sizeStyles[size],
          pulse && 'animate-pulse',
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              dotColorMap[variant] ?? 'bg-primary-500',
              pulse && variant === 'urgent' && 'animate-pulse'
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    );
  }
);
Badge.displayName = 'Badge';

// StatusBadge — 리포트/상담 상태 표시 (한글 라벨 고정)
const StatusBadge = React.forwardRef<
  HTMLDivElement,
  BadgeProps & {
    status: 'received' | 'reviewing' | 'consulting' | 'completed' | 'pending' | 'approved' | 'rejected';
  }
>(({ status, className, ...props }, ref) => {
  const statusConfig = {
    received:   { variant: 'secondary' as const,    label: '접수완료', dot: true },
    reviewing:  { variant: 'warning' as const,      label: '검토중',   dot: true },
    consulting: { variant: 'info' as const,         label: '상담진행', dot: true },
    completed:  { variant: 'success' as const,      label: '해결완료', dot: true },
    pending:    { variant: 'warning' as const,      label: '대기중',   dot: true },
    approved:   { variant: 'success' as const,      label: '승인됨',   dot: true },
    rejected:   { variant: 'error' as const,        label: '거부됨',   dot: true },
  };

  const config = statusConfig[status];

  return (
    <Badge
      ref={ref}
      variant={config.variant}
      dot={config.dot}
      className={className}
      {...props}
    >
      {config.label}
    </Badge>
  );
});
StatusBadge.displayName = 'StatusBadge';

// PriorityBadge — 우선순위 표시
const PriorityBadge = React.forwardRef<
  HTMLDivElement,
  BadgeProps & {
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }
>(({ priority, className, ...props }, ref) => {
  const priorityConfig = {
    low:    { variant: 'secondary' as const, label: '낮음', pulse: false },
    medium: { variant: 'warning' as const,   label: '보통', pulse: false },
    high:   { variant: 'error' as const,     label: '높음', pulse: false },
    urgent: { variant: 'urgent' as const,    label: '긴급', pulse: true },
  };

  const config = priorityConfig[priority];

  return (
    <Badge
      ref={ref}
      variant={config.variant}
      pulse={config.pulse}
      className={className}
      {...props}
    >
      {config.label}
    </Badge>
  );
});
PriorityBadge.displayName = 'PriorityBadge';

export { Badge, StatusBadge, PriorityBadge };
