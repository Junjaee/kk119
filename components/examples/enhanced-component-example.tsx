'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

// Import our new error monitoring and performance tools
import { ErrorBoundary, withErrorBoundary } from '@/components/error-boundary';
import { log } from '@/lib/utils/logger';
import {
  useRenderPerformance,
  useApiPerformance,
  useInteractionTracking,
  useWebVitals,
  useLifecyclePerformance
} from '@/lib/hooks/use-performance';

/**
 * Example component demonstrating the new error handling and performance monitoring
 */
function EnhancedComponentExample() {
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Performance monitoring hooks
  const { getPerformanceStats } = useRenderPerformance('EnhancedComponentExample');
  const { trackApiCall } = useApiPerformance();
  const { trackClick, trackInteraction, getInteractionCount } = useInteractionTracking('enhanced-component');
  const { metrics, getMetric } = useWebVitals();
  const { getUpdateCount, getLifespan } = useLifecyclePerformance('EnhancedComponentExample');

  // Enhanced error handling with logging
  const handleApiCall = useCallback(async () => {
    try {
      setLoading(true);

      // Track user interaction
      trackClick({ action: 'api_call_button' });

      // Use the performance-tracked API call
      const result = await trackApiCall(
        async () => {
          const response = await fetch('/api/health');
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        },
        {
          name: 'health_check',
          method: 'GET',
          url: '/api/health',
          metadata: {
            component: 'EnhancedComponentExample',
            userAction: 'manual_health_check'
          }
        }
      );

      setData(JSON.stringify(result, null, 2));

      // Log successful user action
      log.userAction('health_check_success', 'User successfully triggered health check', {
        component: 'EnhancedComponentExample',
        dataLength: JSON.stringify(result).length
      });

      toast.success('Health check completed successfully!');

    } catch (error) {
      // Enhanced error logging with context
      log.error('Health check failed', error as Error, {
        component: 'EnhancedComponentExample',
        userAction: 'health_check',
        searchTerm,
        interactionCount: getInteractionCount()
      });

      toast.error('Health check failed. Please try again.');
      setData('Error occurred');
    } finally {
      setLoading(false);
    }
  }, [trackApiCall, trackClick, searchTerm, getInteractionCount]);

  // Simulate a component error for testing error boundary
  const triggerError = useCallback(() => {
    trackClick({ action: 'trigger_error_button' });

    log.warn('User triggered intentional error', {
      component: 'EnhancedComponentExample',
      intentional: true
    });

    // This will trigger the error boundary
    throw new Error('Intentional error for testing error boundary');
  }, [trackClick]);

  // Handle search with performance tracking
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);

    trackInteraction('search', {
      searchLength: value.length,
      hasValue: value.length > 0
    });

    log.info('User performed search', {
      component: 'EnhancedComponentExample',
      searchLength: value.length,
      hasValue: value.length > 0
    });
  }, [trackInteraction]);

  // Log performance stats
  const logPerformanceStats = useCallback(() => {
    const renderStats = getPerformanceStats();
    const lcpMetric = getMetric('LCP');

    log.info('Component performance stats', {
      component: 'EnhancedComponentExample',
      renderStats,
      updateCount: getUpdateCount(),
      lifespan: Math.round(getLifespan()),
      lcp: lcpMetric?.value,
      interactionCount: getInteractionCount()
    });

    toast.success('Performance stats logged to console');
  }, [getPerformanceStats, getMetric, getUpdateCount, getLifespan, getInteractionCount]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Enhanced Component Example</CardTitle>
        <p className="text-sm text-gray-600">
          Demonstrates error boundaries, logging, and performance monitoring
        </p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Search Input with Performance Tracking */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search (with performance tracking)</label>
          <Input
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type to see interaction tracking..."
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Interactions: {getInteractionCount()} | Updates: {getUpdateCount()}
          </p>
        </div>

        {/* API Call with Performance Tracking */}
        <div className="space-y-2">
          <Button
            onClick={handleApiCall}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Test API Call (with tracking)'}
          </Button>
        </div>

        {/* Error Testing */}
        <div className="space-y-2">
          <Button
            onClick={triggerError}
            variant="destructive"
            className="w-full"
          >
            Trigger Error (test error boundary)
          </Button>
          <p className="text-xs text-gray-500">
            This will trigger the error boundary and demonstrate error logging
          </p>
        </div>

        {/* Performance Stats */}
        <div className="space-y-2">
          <Button
            onClick={logPerformanceStats}
            variant="outline"
            className="w-full"
          >
            Log Performance Stats
          </Button>
        </div>

        {/* Web Vitals Display */}
        {metrics.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Web Vitals</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {metrics.map((metric) => (
                <div key={metric.name} className="flex justify-between">
                  <span>{metric.name}:</span>
                  <span className={
                    metric.rating === 'good' ? 'text-green-600' :
                    metric.rating === 'needs-improvement' ? 'text-yellow-600' :
                    'text-red-600'
                  }>
                    {Math.round(metric.value)}ms ({metric.rating})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Display */}
        {data && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">API Response</h4>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {data}
            </pre>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
          <p><strong>Monitoring Features:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>All user interactions are tracked and logged</li>
            <li>API calls include performance monitoring</li>
            <li>Component render performance is measured</li>
            <li>Web Vitals are collected automatically</li>
            <li>Errors are caught by error boundary and logged</li>
            <li>All logs include contextual information</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Wrap component with error boundary
const EnhancedComponentWithErrorBoundary = withErrorBoundary(
  EnhancedComponentExample,
  {
    name: 'EnhancedComponentExample',
    level: 'component',
    onError: (error, errorInfo) => {
      // Custom error handling
      log.error('Custom error handler triggered', error, {
        component: 'EnhancedComponentExample',
        errorInfo: errorInfo.componentStack
      });
    }
  }
);

/**
 * Example page showing how to use error boundaries at different levels
 */
export function ErrorBoundaryExamplePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Error Monitoring & Logging Examples</h1>

      {/* Page-level error boundary */}
      <ErrorBoundary name="ExamplePage" level="page">

        {/* Section-level error boundary */}
        <ErrorBoundary name="MainContent" level="section">
          <div className="grid gap-6">

            {/* Component with built-in error boundary */}
            <EnhancedComponentWithErrorBoundary />

            {/* Another component with inline error boundary */}
            <ErrorBoundary name="AdditionalContent" level="component">
              <Card>
                <CardHeader>
                  <CardTitle>Additional Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>This content is also protected by an error boundary.</p>
                  <Button
                    onClick={() => {
                      throw new Error('Another test error');
                    }}
                    variant="outline"
                    className="mt-2"
                  >
                    Trigger Error in This Section
                  </Button>
                </CardContent>
              </Card>
            </ErrorBoundary>

          </div>
        </ErrorBoundary>

      </ErrorBoundary>
    </div>
  );
}

export default EnhancedComponentWithErrorBoundary;