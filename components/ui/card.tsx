import * as React from 'react';
import { cn } from '@/lib/utils/cn';

// @MX:NOTE: [AUTO] Card variant 시스템 — 토큰 기반으로 재정의.
// Legacy variants(urgent/protection/trust)은 semantic 컬러로 alias.

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'modern' | 'glass' | 'elevated' | 'urgent' | 'protection' | 'trust';
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hoverable = false, ...props }, ref) => {
    const variantStyles = {
      default:
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
      modern:
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-colors duration-200',
      glass:
        'rounded-lg border border-border/60 bg-card/70 backdrop-blur-md text-card-foreground shadow-sm',
      elevated:
        'rounded-lg border border-border bg-card text-card-foreground shadow-md hover:shadow-lg transition-shadow duration-200',
      urgent:
        'rounded-lg border border-error-200 bg-error-50/50 text-card-foreground shadow-sm dark:border-error-800 dark:bg-error-950/20',
      protection:
        'rounded-lg border border-info-200 bg-info-50/50 text-card-foreground shadow-sm dark:border-info-800 dark:bg-info-950/20',
      trust:
        'rounded-lg border border-success-200 bg-success-50/50 text-card-foreground shadow-sm dark:border-success-800 dark:bg-success-950/20',
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantStyles[variant],
          hoverable && 'hover:shadow-md transition-shadow duration-200',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-h3 font-semibold leading-tight tracking-tight text-card-foreground',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-small text-muted-foreground leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-between p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

// Additional Card variations (기존 API 유지)
const CardImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn('w-full h-48 object-cover rounded-t-lg', className)}
    {...props}
  />
));
CardImage.displayName = 'CardImage';

const CardBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'primary' | 'secondary' | 'urgent' | 'protection' | 'trust' | 'warning';
  }
>(({ className, variant = 'primary', ...props }, ref) => {
  const badgeVariants = {
    primary:
      'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/40 dark:text-primary-200 dark:border-primary-800',
    secondary:
      'bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
    urgent:
      'bg-error-50 text-error-700 border border-error-200 dark:bg-error-950/50 dark:text-error-300 dark:border-error-800',
    protection:
      'bg-info-50 text-info-700 border border-info-200 dark:bg-info-950/50 dark:text-info-300 dark:border-info-800',
    trust:
      'bg-success-50 text-success-700 border border-success-200 dark:bg-success-950/50 dark:text-success-300 dark:border-success-800',
    warning:
      'bg-warning-50 text-warning-700 border border-warning-200 dark:bg-warning-950/50 dark:text-warning-300 dark:border-warning-800',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
});
CardBadge.displayName = 'CardBadge';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardImage,
  CardBadge,
};
