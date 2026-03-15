import { Module } from '../decorators/module.decorator';
import { ScheduleService } from './schedule.service';

/**
 * ScheduleModule enables cron-based task scheduling.
 * 
 * Import this module and use @Cron() on any @Injectable() provider method.
 * 
 * @example
 * ```ts
 * @Module({
 *   imports: [ScheduleModule],
 *   providers: [TasksService],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
