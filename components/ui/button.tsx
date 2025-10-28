import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'primary' | 'protection' | 'urgent' | 'trust' | 'success' | 'error' | 'warning' | 'info';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';

    const variantStyles = {
      default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md',
      primary: 'bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:brightness-90 transform hover:-translate-y-0.5',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 shadow-md hover:shadow-lg',
      outline: 'border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-md',
      ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-accent-foreground rounded-lg',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md',
      protection: 'bg-protection-600 hover:bg-protection-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
      urgent: 'bg-urgent-600 hover:bg-urgent-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
      trust: 'bg-trust-600 hover:bg-trust-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
      success: 'bg-green-600 text-white shadow-lg hover:bg-green-700 hover:shadow-xl',
      error: 'bg-red-600 text-white shadow-lg hover:bg-red-700 hover:shadow-xl',
      warning: 'bg-yellow-600 text-white shadow-lg hover:bg-yellow-700 hover:shadow-xl',
      info: 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl',
    };

    const sizeStyles = {
      xs: 'h-7 px-2 py-1 text-xs rounded-md',
      sm: 'h-8 px-3 py-1.5 text-xs rounded-lg',
      default: 'h-10 px-6 py-2 text-sm rounded-xl',
      lg: 'h-12 px-8 py-3 text-base rounded-xl',
      icon: 'h-10 w-10 rounded-xl',
    };

    const baseStyles = cn(
      'relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      'hover:scale-[1.02] active:scale-[0.98]',
      variantStyles[variant],
      sizeStyles[size],
      loading && 'pointer-events-none',
      className
    );

    if (asChild) {
      return (
        <span className={baseStyles}>
          {React.cloneElement(children as React.ReactElement, {
            className: cn((children as React.ReactElement).props?.className, 'w-full h-full flex items-center justify-center')
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