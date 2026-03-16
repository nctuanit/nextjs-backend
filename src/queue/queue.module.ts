import type { DynamicModule } from '../interfaces';
import { QueueService } from './queue.service';

export const QUEUE_OPTIONS = 'QUEUE_OPTIONS';

export interface QueueModuleOptions {
  /** Max concurrent jobs per queue. Default: 5 */
  concurrency?: number;
}

/**
 * Set up the in-process job queue system.
 *
 * @example
 * ```ts
 * @Module({
 *   imports: [
 *     QueueModule.register({ concurrency: 10 }),
 *   ],
 *   providers: [EmailProcessor],
 * })
 * export class AppModule {}
 * ```
 */
export class QueueModule {
  static register(options: QueueModuleOptions = {}): DynamicModule {
    return {
      module: QueueModule,
      providers: [
        {
          provide: QUEUE_OPTIONS,
          useValue: { concurrency: options.concurrency ?? 5 },
        },
        {
          provide: QueueService,
          useFactory: () => new QueueService(options.concurrency ?? 5),
        },
      ],
      exports: [QueueService],
    };
  }
}
