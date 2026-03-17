import { Controller, Get } from 'next-js-backend';
import { ScheduleService } from './schedule.service';

@Controller('/schedule')
export class ScheduleController {
  constructor(private readonly svc: ScheduleService) {}

  /** GET /api/schedule/log — returns the @Cron tick history */
  @Get('/log')
  getLog() {
    const entries = this.svc.getLog();
    return {
      description: '@Cron("*/30 * * * * *") fires every 30s — @OnEvent("schedule.tick") also fires on each tick',
      count: entries.length,
      entries,
    };
  }
}
