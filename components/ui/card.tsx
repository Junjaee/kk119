import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'modern' | 'glass' | 'elevated' | 'urgent' | 'protection' | 'trust';
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hoverable = false, ...props }, ref) => {
    const variantStyles = {
      default: 'rounded-xl border bg-card text-card-foreground shadow-sm',
      modern: 'rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm text-card-foreground shadow-lg hover:shadow-xl hover:border-primary/20 transition-all duration-300',
      glass: 'rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-card-foreground shadow-lg dark:border-white/10 dark:bg-black/10',
      elevated: 'rounded-xl border bg-card text-card-foreground shadow-xl hover:shadow-2xl transition-all duration-300',
      urgent: 'rounded-xl border border-urgent-200 bg-urgent-50/50 text-card-foreground shadow-lg dark:border-urgent-800 dark:bg-urgent-950/20',
      protection: 'rounded-xl border border-protection-200 bg-protection-50/50 text-card-foreground shadow-lg dark:border-protection-800 dark:bg-protection-950/20',
      trust: 'rounded-xl border border-trust-200 bg-trust-50/50 text-card-foreground shadow-lg dark:border-trust-800 dark:bg-trust-950/20',
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantStyles[variant],
          hoverable && 'hover:-translate-y-1 hover:scale-[1.02] transition-transform duration-200',
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
    className={cn('flex flex-col space-y-2 p-6 pb-4', className)}
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
      'text-lg font-bold leading-none tracking-tight text-card-foreground',
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
    className={cn('text-sm text-muted-foreground leading-relaxed', className)}
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

// Additional Card variations
const CardImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn('w-full h-48 object-cover rounded-t-xl', className)}
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
    primary: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-secondary/10 text-secondary-foreground border border-border',
    urgent: 'bg-urgent-50 text-urgent-600 border border-urgent-200 dark:bg-urgent-950/50 dark:text-urgent-400',
    protection: 'bg-protection-50 text-protection-600 border border-protection-200 dark:bg-protection-950/50 dark:text-protection-400',
    trust: 'bg-trust-50 text-trust-600 border border-trust-200 dark:bg-trust-950/50 dark:text-trust-400',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
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
  CardBadge 
};