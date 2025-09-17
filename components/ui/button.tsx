import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'primary' | 'protection' | 'urgent' | 'trust';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';

    const variantStyles = {
      default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md',
      primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 transform hover:-translate-y-0.5',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40',
      outline: 'border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-md',
      ghost: 'hover:bg-accent/50 hover:text-accent-foreground rounded-lg',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md',
      protection: 'bg-gradient-to-r from-protection-500 to-protection-600 text-white shadow-lg hover:shadow-xl hover:from-protection-600 hover:to-protection-700 transform hover:-translate-y-0.5',
      urgent: 'bg-gradient-to-r from-urgent-500 to-urgent-600 text-white shadow-lg hover:shadow-xl hover:from-urgent-600 hover:to-urgent-700 transform hover:-translate-y-0.5 animate-pulse',
      trust: 'bg-gradient-to-r from-trust-500 to-trust-600 text-white shadow-lg hover:shadow-xl hover:from-trust-600 hover:to-trust-700 transform hover:-translate-y-0.5',
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