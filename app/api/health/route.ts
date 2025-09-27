import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/middleware';
import { userDb } from '@/lib/db/database';
import { log } from '@/lib/utils/logger';

interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  service: string;
  version: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      usage: {
        used: number;
        total: number;
        percentage: number;
      };
    };
  };
  uptime: number;
}

export const GET = apiHandler(async (request: NextRequest) => {
  const startTime = performance.now();

  // Initialize health check response
  const healthCheck: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '교권119',
    version: process.env.NEXT_PUBLIC_BUILD_VERSION || 'dev',
    checks: {
      database: { status: 'ok' },
      memory: { status: 'ok', usage: { used: 0, total: 0, percentage: 0 } }
    },
    uptime: process.uptime()
  };

  let overallStatus: 'ok' | 'degraded' | 'down' = 'ok';

  // Check database health
  try {
    const dbStartTime = performance.now();

    // Simple database health check - try to query a user count
    userDb.getUserCount();

    const dbResponseTime = performance.now() - dbStartTime;
    healthCheck.checks.database = {
      status: 'ok',
      responseTime: Math.round(dbResponseTime * 100) / 100
    };

    log.info('Database health check passed', {
      responseTime: healthCheck.checks.database.responseTime
    });

    // Warning for slow database response
    if (dbResponseTime > 100) {
      overallStatus = 'degraded';
      log.warn('Slow database response in health check', {
        responseTime: dbResponseTime
      });
    }

  } catch (error) {
    healthCheck.checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
    overallStatus = 'down';

    log.error('Database health check failed', error as Error, {
      action: 'health_check'
    });
  }

  // Check memory usage
  try {
    const memoryUsage = process.memoryUsage();
    const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const percentage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

    let memoryStatus: 'ok' | 'warning' | 'critical' = 'ok';
    if (percentage > 90) {
      memoryStatus = 'critical';
      overallStatus = overallStatus === 'ok' ? 'degraded' : overallStatus;
    } else if (percentage > 80) {
      memoryStatus = 'warning';
      if (overallStatus === 'ok') overallStatus = 'degraded';
    }

    healthCheck.checks.memory = {
      status: memoryStatus,
      usage: {
        used: usedMB,
        total: totalMB,
        percentage
      }
    };

    if (memoryStatus !== 'ok') {
      log.warn('High memory usage detected in health check', {
        usedMB,
        totalMB,
        percentage,
        status: memoryStatus
      });
    }

  } catch (error) {
    log.warn('Failed to check memory usage', { error: error instanceof Error ? error.message : 'Unknown error' });
  }

  // Set overall status
  healthCheck.status = overallStatus;

  const totalResponseTime = performance.now() - startTime;

  log.info('Health check completed', {
    status: overallStatus,
    responseTime: Math.round(totalResponseTime * 100) / 100,
    databaseStatus: healthCheck.checks.database.status,
    memoryStatus: healthCheck.checks.memory.status
  });

  return healthCheck;
});