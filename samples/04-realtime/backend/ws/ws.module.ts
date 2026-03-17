import { Module } from 'next-js-backend';
import { ChatGateway } from './chat.gateway';

@Module({ providers: [ChatGateway] })
export class WsModule {}
