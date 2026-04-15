import * as React from 'react';
import { cn } from '@/lib/utils/cn';

// @MX:ANCHOR: Button은 전 도메인에서 사용되는 기본 UI 컴포넌트 (fan_in 매우 높음).
// @MX:REASON: API(variant/size/asChild/loading) 변경 시 teacher/lawyer/admin 전 페이지 regression 발생.

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'destructive'
    | 'link'
    // Legacy variants (호환 유지, semantic으로 매핑)
    | 'protection'   // → info
    | 'urgent'       // → error
    | 'trust'        // → success
    | 'success'
    | 'error'
    | 'warning'
    | 'info';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';

    // 토큰 기반 variant — 하드코딩 hex/gray/blue 제거
    const variantStyles = {
      default:
        'bg-primary text-primary-foreground shadow-sm hover:bg-primary-600 hover:shadow-md',
      primary:
        'bg-primary-500 text-white shadow-sm hover:bg-primary-600 active:bg-primary-700 hover:shadow-md',
      secondary:
        'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 shadow-xs hover:shadow-sm',
      outline:
        'border border-primary-500 bg-transparent text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 shadow-xs',
      ghost:
        'bg-transparent text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800',
      destructive:
        'bg-error-600 text-error-foreground hover:bg-error-700 shadow-sm hover:shadow-md',
      link:
        'bg-transparent text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline shadow-none',
      // Semantic (신규 권장)
      success:
        'bg-success-600 text-success-foreground hover:bg-success-700 shadow-sm hover:shadow-md',
      error:
        'bg-error-600 text-error-foreground hover:bg-error-700 shadow-sm hover:shadow-md',
      warning:
        'bg-warning-500 text-warning-foreground hover:bg-warning-600 shadow-sm hover:shadow-md',
      info:
        'bg-info-600 text-info-foreground hover:bg-info-700 shadow-sm hover:shadow-md',
      // Legacy alias (동일 매핑)
      protection:
        'bg-info-600 text-info-foreground hover:bg-info-700 shadow-sm hover:shadow-md',
      urgent:
        'bg-error-600 text-error-foreground hover:bg-error-700 shadow-sm hover:shadow-md',
      trust:
        'bg-success-600 text-success-foreground hover:bg-success-700 shadow-sm hover:shadow-md',
    };

    const sizeStyles = {
      xs: 'h-7 px-2.5 text-caption rounded-sm',
      sm: 'h-9 px-3 text-small rounded-md',
      default: 'h-10 px-4 text-small rounded-md',
      lg: 'h-11 px-6 text-body rounded-md',
      icon: 'h-10 w-10 rounded-md',
    };

    const baseStyles = cn(
      'relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:pointer-events-none disabled:opacity-50',
      variantStyles[variant],
      sizeStyles[size],
      loading && 'pointer-events-none',
      className
    );

    if (asChild) {
      return (
        <span className={baseStyles}>
          {React.cloneElement(children as React.ReactElement, {
            className: cn(
              (children as React.ReactElement).props?.className,
              'w-full h-full flex items-center justify-center'
            ),
          })}
        </span>
      );
    }

    return (
      <button
        className={baseStyles}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <span className={cn('flex items-center gap-2', loading && 'opacity-0')}>
          {children}
        </span>
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
