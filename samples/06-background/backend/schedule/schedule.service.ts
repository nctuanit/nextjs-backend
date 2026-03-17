import { Injectable } from 'next-js-backend';
import { Cron, Logger } from 'next-js-backend';
import { OnEvent, EventEmitterService } from 'next-js-backend';

/**
 * ScheduleService — runs @Cron every 30s and listens to 'schedule.tick' via @OnEvent
 */
@Injectable()
export class ScheduleService {
  private log: { at: string; tick: number }[] = [];
  private tick = 0;

  constructor(private readonly emitter: EventEmitterService) {}

  @Cron('*/30 * * * * *')
  onCron() {
    this.tick++;
    const entry = { at: new Date().toISOString(), tick: this.tick };
    this.log.push(entry);
    if (this.log.length > 50) this.log.shift();
    this.emitter.emit('schedule.tick', entry);
    Logger.log(`[Cron] tick #${this.tick} at ${entry.at}`);
  }

  @OnEvent('schedule.tick')
  onTick(payload: { at: string; tick: number }) {
    Logger.log(`[OnEvent] schedule.tick → ${payload.tick}`);
  }

  getLog() { return [...this.log].reverse(); }
}
