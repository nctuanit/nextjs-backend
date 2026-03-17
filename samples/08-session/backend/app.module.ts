import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { SessionModule } from 'next-js-backend';
import { SessionController } from './session/session.controller';

@Module({
  imports: [
    SessionModule.register({
      ttl: 3600, // 1 hour
    }),
  ],
  controllers: [SessionController],
})
export class AppModule {}
