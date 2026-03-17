import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { ConfigModule } from 'next-js-backend';
import { ConfigController } from './config/config.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
  ],
  controllers: [ConfigController],
})
export class AppModule {}
