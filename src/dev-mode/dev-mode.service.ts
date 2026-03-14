import { Injectable } from '../di/injectable.decorator';
import { Logger } from '../services/logger.service';

export interface RequestProfile {
  id: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  timestamp: Date;
  headers: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
  response?: any;
  error?: string;
}

export interface DevModeConfig {
  /**
   * Enable the request profiler (default: false)
   */
  enabled?: boolean;
  
  /**
   * The path to mount the Dev Mode UI
   * @default '/dev'
   */
  apiPath?: string;

  /**
   * Max number of requests to keep in memory
   * @default 100
   */
  maxHistory?: number;
}

export const DEV_MODE_CONFIG = 'DEV_MODE_CONFIG';

import { Inject } from '../di/inject.decorator';

@Injectable()
export class DevModeService {
  private history: RequestProfile[] = [];
  private readonly maxHistory: number;
  private readonly logger = new Logger('DevModeProfiler');

  constructor(@Inject(DEV_MODE_CONFIG) private config: DevModeConfig = {}) {
    this.maxHistory = config.maxHistory || 100;
  }

  public setMaxHistory(limit: number) {
    // Explicit mutator to bypass constructor restrictions if needed
    Object.defineProperty(this, 'maxHistory', { value: limit, writable: true });
  }

  public recordRequest(profile: RequestProfile) {
    this.history.unshift(profile); // Add to beginning (newest first)
    
    // Trim memory array to prevent leaks
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
  }

  public getHistory(): RequestProfile[] {
    return this.history;
  }

  public clearHistory() {
    this.history = [];
    this.logger.log('Request history cleared.');
  }

  public getStats() {
    const totalRequests = this.history.length;
    if (totalRequests === 0) return { totalRequests: 0, avgDuration: 0, errorRate: 0 };
    
    const totalDuration = this.history.reduce((sum, req) => sum + req.durationMs, 0);
    const errorCount = this.history.filter(req => req.status >= 400).length;

    return {
      totalRequests,
      avgDuration: parseFloat((totalDuration / totalRequests).toFixed(2)),
      errorRate: parseFloat(((errorCount / totalRequests) * 100).toFixed(2))
    };
  }
}
