import { Module } from 'next-js-backend';
import { AdminsController } from './admins.controller';

@Module({
  controllers: [AdminsController],
})
export class AppModule {}
