import { Module } from 'next-js-backend';
import { PipelineController } from './pipeline.controller';
import { RolesGuard } from './roles.guard';
import { TimingInterceptor } from './timing.interceptor';

@Module({
  controllers: [PipelineController],
  providers: [RolesGuard, TimingInterceptor],
})
export class PipelineModule {}
