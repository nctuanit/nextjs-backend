import { Injectable } from '../di/injectable.decorator';

/**
 * HealthService provides system health information.
 */
@Injectable()
export class HealthService {
  private startedAt = Date.now();

  check() {
    const memUsage = process.memoryUsage();
    return {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };
  }
}
