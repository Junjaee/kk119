import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'primary' | 'protection' | 'urgent' | 'trust';
  size?: 'sm' | 'default' | 'lg';
  dot?: boolean;
  pulse?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', dot = false, pulse = false, children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20',
      primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground border border-border/40 hover:bg-secondary/80',
      outline: 'border-2 border-input bg-transparent hover:bg-accent',
      success: 'bg-trust-50 text-trust-700 border border-trust-200 dark:bg-trust-950/50 dark:text-trust-400 hover:bg-trust-100 dark:hover:bg-trust-900/50',
      warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50',
      error: 'bg-urgent-50 text-urgent-700 border border-urgent-200 dark:bg-urgent-950/50 dark:text-urgent-400 hover:bg-urgent-100 dark:hover:bg-urgent-900/50',
      protection: 'bg-protection-50 text-protection-700 border border-protection-200 dark:bg-protection-950/50 dark:text-protection-400 hover:bg-protection-100 dark:hover:bg-protection-900/50',
      urgent: 'bg-urgent-500 text-white shadow-md hover:bg-urgent-600',
      trust: 'bg-trust-50 text-trust-700 border border-trust-200 dark:bg-trust-950/50 dark:text-trust-400 hover:bg-trust-100 dark:hover:bg-trust-900/50',
    };
    
    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs h-5',
      default: 'px-3 py-1 text-xs h-6',
      lg: 'px-4 py-1.5 text-sm h-8',
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1 rounded-full font-semibold transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          variantStyles[variant],
          sizeStyles[size],
          pulse && 'animate-pulse',
          className
        )}
        {...props}
      >
        {dot && (
          <div 
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              variant === 'urgent' && 'bg-white animate-pulse',
              variant === 'success' && 'bg-trust-500',
              variant === 'warning' && 'bg-yellow-500',
              variant === 'error' && 'bg-urgent-500',
              variant === 'protection' && 'bg-protection-500',
              variant === 'primary' && 'bg-primary',
              variant === 'default' && 'bg-primary'
            )}
          />
        )}
        {children}
      </div>
    );
  }
);
Badge.displayName = 'Badge';

// Additional Badge variations
const StatusBadge = React.forwardRef<
  HTMLDivElement,
  BadgeProps & {
    status: 'received' | 'reviewing' | 'consulting' | 'completed' | 'pending' | 'approved' | 'rejected';
  }
>(({ status, className, ...props }, ref) => {
  const statusConfig = {
    received: { variant: 'secondary' as const, label: '접수완료', dot: true },
    reviewing: { variant: 'warning' as const, label: '검토중', dot: true },
    consulting: { variant: 'protection' as const, label: '상담진행', dot: true },
    completed: { variant: 'success' as const, label: '해결완료', dot: true },
    pending: { variant: 'warning' as const, label: '대기중', dot: true },
    approved: { variant: 'success' as const, label: '승인됨', dot: true },
    rejected: { variant: 'error' as const, label: '거부됨', dot: true },
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

const PriorityBadge = React.forwardRef<
  HTMLDivElement,
  BadgeProps & {
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }
>(({ priority, className, ...props }, ref) => {
  const priorityConfig = {
    low: { variant: 'secondary' as const, label: '낮음', pulse: false },
    medium: { variant: 'warning' as const, label: '보통', pulse: false },
    high: { variant: 'error' as const, label: '높음', pulse: false },
    urgent: { variant: 'urgent' as const, label: '긴급', pulse: true },
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