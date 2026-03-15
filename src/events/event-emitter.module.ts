import { Module } from '../decorators/module.decorator';
import { EventEmitterService } from './event-emitter.service';

/**
 * EventEmitterModule provides internal event pub/sub.
 * 
 * @example
 * ```ts
 * @Module({
 *   imports: [EventEmitterModule],
 *   providers: [NotificationService],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  providers: [EventEmitterService],
  exports: [EventEmitterService],
})
export class EventEmitterModule {}
