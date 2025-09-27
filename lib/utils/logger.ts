/**
 * Centralized Logging System for kk119 Project
 * Provides structured logging with context, performance tracking, and error monitoring
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  requestId?: string;
  sessionId?: string;
  associationId?: string;
  component?: string;
  action?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: string;
  environment?: 'development' | 'production' | 'test';
  buildVersion?: string;
  [key: string]: any;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  requestSize?: number;
  responseSize?: number;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
  performance?: PerformanceMetrics;
  timestamp: string;
  environment: 'client' | 'server';
}

class Logger {
  private static instance: Logger;
  private context: LogContext = {};
  private performanceMap = new Map<string, number>();
  private logLevel: LogLevel = LogLevel.DEBUG;

  private constructor() {
    // Set log level based on environment
    if (typeof window !== 'undefined') {
      // Client-side
      this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
      this.context.environment = process.env.NODE_ENV as any || 'development';
      this.context.userAgent = navigator.userAgent;
      this.context.url = window.location.href;
    } else {
      // Server-side
      this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
      this.context.environment = process.env.NODE_ENV as any || 'development';
    }

    this.context.buildVersion = process.env.NEXT_PUBLIC_BUILD_VERSION || 'dev';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set global context that will be included in all logs
   */
  public setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Update specific context fields
   */
  public updateContext(key: keyof LogContext, value: any): void {
    this.context[key] = value;
  }

  /**
   * Clear context (useful for new requests or user logout)
   */
  public clearContext(keysToKeep: (keyof LogContext)[] = ['environment', 'buildVersion']): void {
    const newContext: LogContext = {};
    keysToKeep.forEach(key => {
      if (this.context[key] !== undefined) {
        newContext[key] = this.context[key];
      }
    });
    this.context = newContext;
  }

  /**
   * Set the minimum log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    additionalContext?: Partial<LogContext>,
    error?: Error,
    performanceId?: string
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: typeof window !== 'undefined' ? 'client' : 'server',
      context: { ...this.context, ...additionalContext }
    };

    if (error) {
      entry.error = error;
      entry.stack = error.stack;
    }

    if (performanceId && this.performanceMap.has(performanceId)) {
      const startTime = this.performanceMap.get(performanceId)!;
      const endTime = performance.now();
      entry.performance = {
        startTime,
        endTime,
        duration: endTime - startTime
      };

      // Add memory usage if available (Node.js)
      if (typeof window === 'undefined' && process.memoryUsage) {
        entry.performance.memoryUsage = process.memoryUsage();
      }

      this.performanceMap.delete(performanceId);
    }

    return entry;
  }

  /**
   * Output log entry to appropriate destination
   */
  private output(entry: LogEntry): void {
    if (entry.level < this.logLevel) {
      return; // Skip logs below minimum level
    }

    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const message = entry.message;
    const context = entry.context ? JSON.stringify(entry.context, null, 2) : '';

    // Format for console output
    const prefix = `[${timestamp}] [${levelName}]`;

    if (typeof window !== 'undefined') {
      // Client-side console output with styling
      const styles = this.getConsoleStyles(entry.level);
      console.groupCollapsed(`%c${prefix} ${message}`, styles);

      if (context) {
        console.log('Context:', entry.context);
      }

      if (entry.error) {
        console.error('Error:', entry.error);
      }

      if (entry.performance) {
        console.log('Performance:', entry.performance);
      }

      console.groupEnd();
    } else {
      // Server-side structured output
      const logData = {
        timestamp,
        level: levelName,
        message,
        ...entry.context,
        ...(entry.error && {
          error: entry.error.message,
          stack: entry.error.stack
        }),
        ...(entry.performance && { performance: entry.performance })
      };

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(JSON.stringify(logData));
          break;
        case LogLevel.INFO:
          console.info(JSON.stringify(logData));
          break;
        case LogLevel.WARN:
          console.warn(JSON.stringify(logData));
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(JSON.stringify(logData));
          break;
      }
    }

    // In production, you would also send to external monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(entry);
    }
  }

  /**
   * Get console styles for different log levels
   */
  private getConsoleStyles(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'color: #6b7280; font-weight: normal;';
      case LogLevel.INFO:
        return 'color: #3b82f6; font-weight: normal;';
      case LogLevel.WARN:
        return 'color: #f59e0b; font-weight: bold;';
      case LogLevel.ERROR:
        return 'color: #ef4444; font-weight: bold;';
      case LogLevel.FATAL:
        return 'color: #dc2626; font-weight: bold; background: #fef2f2;';
      default:
        return 'color: inherit;';
    }
  }

  /**
   * Send logs to external monitoring service (placeholder)
   */
  private sendToMonitoringService(entry: LogEntry): void {
    // TODO: Implement integration with monitoring services like:
    // - Sentry for error tracking
    // - DataDog for logging
    // - LogRocket for user session recording
    // - Custom analytics endpoint

    // For now, just log that we would send it
    if (entry.level >= LogLevel.ERROR) {
      // Only send errors and above to external service to avoid noise
      console.log('[MONITORING] Would send to external service:', {
        level: LogLevel[entry.level],
        message: entry.message,
        context: entry.context
      });
    }
  }

  /**
   * Public logging methods
   */
  public debug(message: string, context?: Partial<LogContext>): void {
    this.output(this.createLogEntry(LogLevel.DEBUG, message, context));
  }

  public info(message: string, context?: Partial<LogContext>): void {
    this.output(this.createLogEntry(LogLevel.INFO, message, context));
  }

  public warn(message: string, context?: Partial<LogContext>): void {
    this.output(this.createLogEntry(LogLevel.WARN, message, context));
  }

  public error(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.output(this.createLogEntry(LogLevel.ERROR, message, context, error));
  }

  public fatal(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.output(this.createLogEntry(LogLevel.FATAL, message, context, error));
  }

  /**
   * Performance tracking methods
   */
  public startPerformanceTracking(id: string): void {
    this.performanceMap.set(id, performance.now());
  }

  public endPerformanceTracking(id: string, message: string, context?: Partial<LogContext>): void {
    this.output(this.createLogEntry(LogLevel.INFO, message, context, undefined, id));
  }

  /**
   * HTTP request logging helper
   */
  public logRequest(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
    context?: Partial<LogContext>
  ): void {
    const requestContext = {
      ...context,
      action: 'http_request',
      method,
      url,
      statusCode,
      duration
    };

    if (statusCode && statusCode >= 400) {
      this.error(`HTTP ${method} ${url} failed with status ${statusCode}`, undefined, requestContext);
    } else {
      this.info(`HTTP ${method} ${url} completed`, requestContext);
    }
  }

  /**
   * Database operation logging
   */
  public logDbOperation(
    operation: string,
    table: string,
    duration?: number,
    recordCount?: number,
    context?: Partial<LogContext>
  ): void {
    const dbContext = {
      ...context,
      action: 'db_operation',
      operation,
      table,
      duration,
      recordCount
    };

    this.info(`Database ${operation} on ${table}`, dbContext);
  }

  /**
   * User action logging
   */
  public logUserAction(
    action: string,
    details?: string,
    context?: Partial<LogContext>
  ): void {
    const actionContext = {
      ...context,
      action: 'user_action',
      actionType: action,
      details
    };

    this.info(`User action: ${action}`, actionContext);
  }

  /**
   * Security event logging
   */
  public logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: string,
    context?: Partial<LogContext>
  ): void {
    const securityContext = {
      ...context,
      action: 'security_event',
      event,
      severity,
      details
    };

    const level = severity === 'critical' ? LogLevel.FATAL :
                  severity === 'high' ? LogLevel.ERROR :
                  severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;

    this.output(this.createLogEntry(level, `Security event: ${event}`, securityContext));
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions for easier usage
export const log = {
  debug: (message: string, context?: Partial<LogContext>) => logger.debug(message, context),
  info: (message: string, context?: Partial<LogContext>) => logger.info(message, context),
  warn: (message: string, context?: Partial<LogContext>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Partial<LogContext>) => logger.error(message, error, context),
  fatal: (message: string, error?: Error, context?: Partial<LogContext>) => logger.fatal(message, error, context),

  // Specialized logging functions
  request: (method: string, url: string, statusCode?: number, duration?: number, context?: Partial<LogContext>) =>
    logger.logRequest(method, url, statusCode, duration, context),

  dbOp: (operation: string, table: string, duration?: number, recordCount?: number, context?: Partial<LogContext>) =>
    logger.logDbOperation(operation, table, duration, recordCount, context),

  userAction: (action: string, details?: string, context?: Partial<LogContext>) =>
    logger.logUserAction(action, details, context),

  security: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: string, context?: Partial<LogContext>) =>
    logger.logSecurityEvent(event, severity, details, context),

  // Performance tracking
  startTimer: (id: string) => logger.startPerformanceTracking(id),
  endTimer: (id: string, message: string, context?: Partial<LogContext>) =>
    logger.endPerformanceTracking(id, message, context),

  // Context management
  setContext: (context: Partial<LogContext>) => logger.setContext(context),
  updateContext: (key: keyof LogContext, value: any) => logger.updateContext(key, value),
  clearContext: (keysToKeep?: (keyof LogContext)[]) => logger.clearContext(keysToKeep)
};

export default log;