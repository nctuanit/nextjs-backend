import { Module } from '../../index';
import { DashboardController } from './dashboard.controller';
import { AuthGuard } from './auth.guard';
import { LoggingInterceptor } from './logging.interceptor';

@Module({
  controllers: [DashboardController],
  providers: [AuthGuard, LoggingInterceptor]
})
export class AppModule {}
