import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { QueueModule, ScheduleModule, EventEmitterModule } from 'next-js-backend';
import { EmailProcessor } from './queue/email.processor';
import { QueueController } from './queue/queue.controller';
import { ScheduleService } from './schedule/schedule.service';
import { ScheduleController } from './schedule/schedule.controller';

@Module({
  imports: [
    QueueModule.register(),
    ScheduleModule,
    EventEmitterModule,
  ],
  providers: [EmailProcessor, ScheduleService],
  controllers: [QueueController, ScheduleController],
})
export class AppModule {}
