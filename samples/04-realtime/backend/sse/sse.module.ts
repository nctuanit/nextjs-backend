import { Module } from 'next-js-backend';
import { SseController, SseEventListener } from './sse.controller';

@Module({ controllers: [SseController], providers: [SseEventListener] })
export class SseModule {}
