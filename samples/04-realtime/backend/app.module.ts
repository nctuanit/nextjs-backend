import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { EventEmitterModule } from 'next-js-backend';
import { SseModule } from './sse/sse.module';
import { WsModule } from './ws/ws.module';

@Module({
  imports: [EventEmitterModule, SseModule, WsModule],
})
export class AppModule {}
