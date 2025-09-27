export {
  ErrorBoundary,
  PageErrorFallback,
  SectionErrorFallback,
  ComponentErrorFallback,
  withErrorBoundary,
  useErrorHandler,
  createErrorBoundary
} from './error-boundary';

export type {
  ErrorFallbackProps
} from './error-boundary';

// Pre-configured error boundaries for common use cases
export const PageErrorBoundary = createErrorBoundary('PageContent', 'page');
export const DashboardErrorBoundary = createErrorBoundary('Dashboard', 'section');
export const FormErrorBoundary = createErrorBoundary('Form', 'component');
export const TableErrorBoundary = createErrorBoundary('Table', 'component');
export const ChartErrorBoundary = createErrorBoundary('Chart', 'component');