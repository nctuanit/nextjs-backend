import { Module } from '../decorators/module.decorator';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * HealthModule auto-exposes a GET /health endpoint.
 *
 * Import it to add health checks to your application:
 *   @Module({ imports: [HealthModule] })
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
