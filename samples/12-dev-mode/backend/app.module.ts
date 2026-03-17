import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { DevModeModule } from 'next-js-backend';
import { DemoController } from './demo/demo.controller';

@Module({
  imports: [
    DevModeModule.register({
      enabled: process.env.NODE_ENV !== 'production',
      showRoutes: true,
      logRequests: true,
    }),
  ],
  controllers: [DemoController],
})
export class AppModule {}
