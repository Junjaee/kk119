import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// @MX:NOTE: [AUTO] Alert variants — semantic token 기반으로 success/warning/error/info 확장.

const alertVariants = cva(
  "relative w-full rounded-md border px-4 py-3 text-small [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground border-border",
        destructive:
          "border-error-300 bg-error-50 text-error-800 dark:border-error-800 dark:bg-error-950/50 dark:text-error-200 [&>svg]:text-error-600 dark:[&>svg]:text-error-400",
        success:
          "border-success-300 bg-success-50 text-success-800 dark:border-success-800 dark:bg-success-950/50 dark:text-success-200 [&>svg]:text-success-600 dark:[&>svg]:text-success-400",
        warning:
          "border-warning-300 bg-warning-50 text-warning-900 dark:border-warning-800 dark:bg-warning-950/50 dark:text-warning-200 [&>svg]:text-warning-600 dark:[&>svg]:text-warning-400",
        info:
          "border-info-300 bg-info-50 text-info-800 dark:border-info-800 dark:bg-info-950/50 dark:text-info-200 [&>svg]:text-info-600 dark:[&>svg]:text-info-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 text-small font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-small [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
