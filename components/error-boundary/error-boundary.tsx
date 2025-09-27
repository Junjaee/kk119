'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { log } from '@/lib/utils/logger';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
  name?: string;
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  level: string;
  name?: string;
  errorId: string | null;
}

type ComponentType<P = {}> = React.ComponentType<P> | React.FunctionComponent<P>;

/**
 * Generic Error Boundary that catches React errors and provides fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component', name } = this.props;
    const { errorId } = this.state;

    // Log the error with context
    log.error('React Error Boundary Caught Error', error, {
      component: name || 'Unknown',
      level,
      errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ErrorBoundary',
      props: this.props.children ? Object.keys(this.props.children as any).join(', ') : 'none'
    });

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to external monitoring service
    this.reportToMonitoringService(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  private reportToMonitoringService = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to external service like Sentry
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement external error reporting
      console.log('[MONITORING] Would report error to external service', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  };

  private resetError = () => {
    log.info('Error boundary reset', {
      errorId: this.state.errorId,
      component: this.props.name || 'Unknown'
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private autoReset = () => {
    // Auto-reset after 30 seconds for better UX
    this.resetTimeoutId = window.setTimeout(() => {
      if (this.state.hasError) {
        log.info('Auto-resetting error boundary', {
          errorId: this.state.errorId,
          component: this.props.name || 'Unknown'
        });
        this.resetError();
      }
    }, 30000);
  };

  render() {
    if (this.state.hasError) {
      const { fallback: CustomFallback, level = 'component', name } = this.props;
      const { error, errorInfo, errorId } = this.state;

      // Start auto-reset timer
      if (!this.resetTimeoutId) {
        this.autoReset();
      }

      // Use custom fallback if provided
      if (CustomFallback) {
        return (
          <CustomFallback
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetError}
            level={level}
            name={name}
            errorId={errorId}
          />
        );
      }

      // Use default fallback based on level
      switch (level) {
        case 'page':
          return (
            <PageErrorFallback
              error={error}
              errorInfo={errorInfo}
              resetError={this.resetError}
              level={level}
              name={name}
              errorId={errorId}
            />
          );
        case 'section':
          return (
            <SectionErrorFallback
              error={error}
              errorInfo={errorInfo}
              resetError={this.resetError}
              level={level}
              name={name}
              errorId={errorId}
            />
          );
        case 'component':
        default:
          return (
            <ComponentErrorFallback
              error={error}
              errorInfo={errorInfo}
              resetError={this.resetError}
              level={level}
              name={name}
              errorId={errorId}
            />
          );
      }
    }

    return this.props.children;
  }
}

/**
 * Page-level error fallback - shown when entire page crashes
 */
export const PageErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  name,
  errorId
}) => {
  const handleGoHome = () => {
    log.userAction('navigate_home_from_error', 'User navigated to home from error page', {
      errorId,
      component: name
    });
    window.location.href = '/';
  };

  const handleReload = () => {
    log.userAction('reload_from_error', 'User reloaded page from error', {
      errorId,
      component: name
    });
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">
              페이지에 오류가 발생했습니다
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              예상치 못한 오류로 인해 페이지를 표시할 수 없습니다.
              잠시 후 다시 시도해 주세요.
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  개발자 정보 (개발 모드에서만 표시)
                </summary>
                <div className="mt-2 p-3 bg-red-50 rounded border text-xs font-mono text-red-800 whitespace-pre-wrap">
                  <div className="font-bold">Error ID: {errorId}</div>
                  <div className="mt-1">Message: {error.message}</div>
                  {error.stack && (
                    <div className="mt-1">
                      Stack: {error.stack.slice(0, 500)}
                      {error.stack.length > 500 && '...'}
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={resetError} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </Button>
              <Button variant="outline" onClick={handleReload} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                페이지 새로고침
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                홈으로 이동
              </Button>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              오류 ID: {errorId} | 문제가 지속되면 관리자에게 문의하세요.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Section-level error fallback - shown when a section of the page crashes
 */
export const SectionErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  name,
  errorId
}) => {
  return (
    <Card className="bg-red-50 border-red-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">
              섹션 로딩 중 오류가 발생했습니다
            </h3>
            <p className="text-sm text-red-600 mt-1">
              {name ? `${name} 섹션` : '이 섹션'}을 표시할 수 없습니다.
            </p>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-4">
            <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
              오류 상세 정보
            </summary>
            <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono text-red-800">
              Error ID: {errorId}<br />
              {error.message}
            </div>
          </details>
        )}

        <Button size="sm" onClick={resetError} className="bg-red-600 hover:bg-red-700">
          <RefreshCw className="h-3 w-3 mr-1" />
          다시 시도
        </Button>
      </CardContent>
    </Card>
  );
};

/**
 * Component-level error fallback - shown when a small component crashes
 */
export const ComponentErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  name,
  errorId
}) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
      <span className="text-sm text-red-700">
        {name ? `${name} ` : ''}컴포넌트 오류
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={resetError}
        className="h-6 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-100"
      >
        <RefreshCw className="h-3 w-3" />
      </Button>
      {process.env.NODE_ENV === 'development' && (
        <span className="text-xs text-red-500 font-mono">
          ID: {errorId?.slice(-6)}
        </span>
      )}
    </div>
  );
};

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook to trigger error boundaries for testing or manual error handling
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    log.error('Manual error triggered', error, {
      component: 'useErrorHandler',
      errorInfo
    });

    // Re-throw the error to trigger error boundary
    throw error;
  };
}

/**
 * Utility function to create error boundary with specific configuration
 */
export const createErrorBoundary = (
  name: string,
  level: 'page' | 'section' | 'component' = 'component',
  customFallback?: ComponentType<ErrorFallbackProps>
) => {
  return ({ children }: { children: ReactNode }) => (
    <ErrorBoundary
      name={name}
      level={level}
      fallback={customFallback}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;