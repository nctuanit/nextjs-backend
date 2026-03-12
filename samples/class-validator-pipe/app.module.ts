import { Module } from '../../index';
import { AdminsController } from './admins.controller';

@Module({
  controllers: [AdminsController],
})
export class AppModule {}
