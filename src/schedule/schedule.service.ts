import { Cron as CronJob } from 'croner';
import { Injectable } from '../di/injectable.decorator';
import { CRON_METADATA } from './cron.decorator';
import { Logger } from '../services/logger.service';

interface CronJobEntry {
  methodName: string;
  expression: string;
  name: string;
}

/**
 * ScheduleService manages all registered cron jobs.
 * It scans providers for @Cron() decorated methods and starts them.
 */
@Injectable()
export class ScheduleService {
  private readonly logger = new Logger('ScheduleModule');
  private jobs: CronJob[] = [];

  /**
   * Register all cron jobs found on a provider instance.
   */
  registerCronJobs(instance: object) {
    const constructor = instance.constructor;
    const cronEntries: CronJobEntry[] = Reflect.getMetadata(CRON_METADATA, constructor) || [];

    for (const entry of cronEntries) {
      const method = (instance as Record<string, Function>)[entry.methodName];
      if (typeof method !== 'function') continue;

      const job = new CronJob(entry.expression, async () => {
        try {
          await method.call(instance);
        } catch (error) {
          this.logger.error(`Error in cron job "${entry.name}":`, String(error));
        }
      });

      this.jobs.push(job);
      this.logger.log(`Registered cron job "${entry.name}" (${entry.expression})`);
    }
  }

  /**
   * Stop all running cron jobs (for graceful shutdown).
   */
  stopAll() {
    for (const job of this.jobs) {
      job.stop();
    }
    this.jobs = [];
  }
}
