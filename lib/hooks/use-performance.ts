'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { log } from '@/lib/utils/logger';

// Types for performance monitoring
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  componentName?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * Hook to measure render performance of components
 */
export function useRenderPerformance(componentName: string, enabled: boolean = true) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const totalRenderTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      totalRenderTime.current += renderTime;

      // Log slow renders (> 16ms for 60fps)
      if (renderTime > 16) {
        log.warn('Slow component render detected', {
          component: componentName,
          renderTime: Math.round(renderTime * 100) / 100,
          renderCount: renderCount.current,
          avgRenderTime: Math.round((totalRenderTime.current / renderCount.current) * 100) / 100
        });
      }

      // Log performance metrics every 10 renders
      if (renderCount.current % 10 === 0) {
        log.info('Component render performance', {
          component: componentName,
          renderCount: renderCount.current,
          lastRenderTime: Math.round(renderTime * 100) / 100,
          avgRenderTime: Math.round((totalRenderTime.current / renderCount.current) * 100) / 100,
          totalRenderTime: Math.round(totalRenderTime.current * 100) / 100
        });
      }
    };
  });

  const getPerformanceStats = useCallback(() => {
    return {
      renderCount: renderCount.current,
      totalRenderTime: totalRenderTime.current,
      avgRenderTime: renderCount.current > 0 ? totalRenderTime.current / renderCount.current : 0
    };
  }, []);

  return { getPerformanceStats };
}

/**
 * Hook to measure API call performance
 */
export function useApiPerformance() {
  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options: {
      name: string;
      method?: string;
      url?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<T> => {
    const startTime = performance.now();
    const timerId = `api_${options.name}_${Date.now()}`;

    log.startTimer(timerId);

    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;

      log.endTimer(timerId, `API call completed: ${options.name}`, {
        apiCall: options.name,
        method: options.method,
        url: options.url,
        duration: Math.round(duration * 100) / 100,
        success: true,
        ...options.metadata
      });

      // Log slow API calls (> 1000ms)
      if (duration > 1000) {
        log.warn('Slow API call detected', {
          apiCall: options.name,
          duration: Math.round(duration * 100) / 100,
          method: options.method,
          url: options.url
        });
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      log.error('API call failed', error as Error, {
        apiCall: options.name,
        method: options.method,
        url: options.url,
        duration: Math.round(duration * 100) / 100,
        success: false,
        ...options.metadata
      });

      throw error;
    }
  }, []);

  return { trackApiCall };
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking(elementName: string, enabled: boolean = true) {
  const interactionCount = useRef<number>(0);
  const lastInteractionTime = useRef<number>(0);

  const trackInteraction = useCallback((interactionType: string, metadata?: Record<string, any>) => {
    if (!enabled) return;

    const now = performance.now();
    interactionCount.current += 1;

    const timeSinceLastInteraction = lastInteractionTime.current > 0
      ? now - lastInteractionTime.current
      : 0;

    lastInteractionTime.current = now;

    log.userAction('user_interaction', `${interactionType} on ${elementName}`, {
      element: elementName,
      interactionType,
      interactionCount: interactionCount.current,
      timeSinceLastInteraction: timeSinceLastInteraction > 0
        ? Math.round(timeSinceLastInteraction * 100) / 100
        : undefined,
      ...metadata
    });
  }, [elementName, enabled]);

  const trackClick = useCallback((metadata?: Record<string, any>) => {
    trackInteraction('click', metadata);
  }, [trackInteraction]);

  const trackFocus = useCallback((metadata?: Record<string, any>) => {
    trackInteraction('focus', metadata);
  }, [trackInteraction]);

  const trackScroll = useCallback((metadata?: Record<string, any>) => {
    trackInteraction('scroll', metadata);
  }, [trackInteraction]);

  return {
    trackClick,
    trackFocus,
    trackScroll,
    trackInteraction,
    getInteractionCount: () => interactionCount.current
  };
}

/**
 * Hook to monitor Web Vitals
 */
export function useWebVitals() {
  const [metrics, setMetrics] = useState<WebVitalsMetric[]>([]);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const handleWebVitals = (metric: WebVitalsMetric) => {
      setMetrics(prev => {
        const updated = [...prev.filter(m => m.name !== metric.name), metric];

        // Log the metric
        log.info('Web Vitals metric', {
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id
        });

        // Log warning for poor ratings
        if (metric.rating === 'poor') {
          log.warn('Poor Web Vitals metric detected', {
            metric: metric.name,
            value: metric.value,
            rating: metric.rating
          });
        }

        return updated;
      });
    };

    // Dynamically import web-vitals to avoid SSR issues
    let cleanup: (() => void) | undefined;

    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      onCLS(handleWebVitals);
      onFID(handleWebVitals);
      onFCP(handleWebVitals);
      onLCP(handleWebVitals);
      onTTFB(handleWebVitals);

      cleanup = () => {
        // web-vitals doesn't provide cleanup, but we can clear our state
        setMetrics([]);
      };
    }).catch((error) => {
      log.warn('Failed to load web-vitals library', { error: error.message });
    });

    return cleanup;
  }, []);

  const getMetric = useCallback((name: string) => {
    return metrics.find(m => m.name === name);
  }, [metrics]);

  const getAllMetrics = useCallback(() => {
    return metrics;
  }, [metrics]);

  return {
    metrics,
    getMetric,
    getAllMetrics
  };
}

/**
 * Hook to monitor memory usage
 */
export function useMemoryMonitoring(interval: number = 10000) {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);

  useEffect(() => {
    // Only run in browser and if performance.memory is available
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return;
    }

    const checkMemory = () => {
      const memory = (performance as any).memory as MemoryInfo;
      if (memory) {
        setMemoryInfo(memory);

        // Log memory usage
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

        log.info('Memory usage', {
          usedMB,
          totalMB,
          limitMB,
          usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
        });

        // Warning for high memory usage
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          log.warn('High memory usage detected', {
            usedMB,
            totalMB,
            limitMB,
            usagePercent: Math.round(usagePercent)
          });
        }
      }
    };

    checkMemory();
    const intervalId = setInterval(checkMemory, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return memoryInfo;
}

/**
 * Hook to monitor network information
 */
export function useNetworkMonitoring() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  useEffect(() => {
    // Only run in browser and if navigator.connection is available
    if (typeof window === 'undefined' || !('connection' in navigator)) {
      return;
    }

    const connection = (navigator as any).connection;

    const updateNetworkInfo = () => {
      if (connection) {
        const info: NetworkInfo = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };

        setNetworkInfo(info);

        log.info('Network information updated', {
          effectiveType: info.effectiveType,
          downlink: info.downlink,
          rtt: info.rtt,
          saveData: info.saveData
        });

        // Warning for slow connection
        if (info.effectiveType === 'slow-2g' || info.effectiveType === '2g') {
          log.warn('Slow network connection detected', {
            effectiveType: info.effectiveType,
            downlink: info.downlink,
            rtt: info.rtt
          });
        }
      }
    };

    updateNetworkInfo();

    if (connection.addEventListener) {
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  return networkInfo;
}

/**
 * Hook to track page load performance
 */
export function usePageLoadPerformance(pageName: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const measurePageLoad = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        const metrics = {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          connection: navigation.connectEnd - navigation.connectStart,
          request: navigation.responseStart - navigation.requestStart,
          response: navigation.responseEnd - navigation.responseStart,
          domParsing: navigation.domInteractive - navigation.responseEnd,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          pageLoad: navigation.loadEventEnd - navigation.loadEventStart,
          total: navigation.loadEventEnd - navigation.navigationStart
        };

        log.info('Page load performance', {
          page: pageName,
          ...Object.fromEntries(
            Object.entries(metrics).map(([key, value]) => [key, Math.round(value * 100) / 100])
          )
        });

        // Warning for slow page loads
        if (metrics.total > 3000) {
          log.warn('Slow page load detected', {
            page: pageName,
            totalTime: Math.round(metrics.total * 100) / 100
          });
        }
      }
    };

    // Measure after page is fully loaded
    if (document.readyState === 'complete') {
      measurePageLoad();
    } else {
      window.addEventListener('load', measurePageLoad);
      return () => window.removeEventListener('load', measurePageLoad);
    }
  }, [pageName]);
}

/**
 * Custom hook to track component lifecycle performance
 */
export function useLifecyclePerformance(componentName: string) {
  const mountTime = useRef<number>(0);
  const updateCount = useRef<number>(0);

  useEffect(() => {
    // Component mount
    mountTime.current = performance.now();

    log.debug('Component mounted', {
      component: componentName,
      mountTime: mountTime.current
    });

    return () => {
      // Component unmount
      const unmountTime = performance.now();
      const lifespan = unmountTime - mountTime.current;

      log.debug('Component unmounted', {
        component: componentName,
        lifespan: Math.round(lifespan * 100) / 100,
        updateCount: updateCount.current
      });
    };
  }, [componentName]);

  useEffect(() => {
    // Component update
    updateCount.current += 1;

    if (updateCount.current > 1) { // Skip first update (which is mount)
      log.debug('Component updated', {
        component: componentName,
        updateCount: updateCount.current
      });
    }
  });

  return {
    getUpdateCount: () => updateCount.current,
    getLifespan: () => mountTime.current > 0 ? performance.now() - mountTime.current : 0
  };
}

export default {
  useRenderPerformance,
  useApiPerformance,
  useInteractionTracking,
  useWebVitals,
  useMemoryMonitoring,
  useNetworkMonitoring,
  usePageLoadPerformance,
  useLifecyclePerformance
};