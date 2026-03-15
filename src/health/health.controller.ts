import { Controller } from '../decorators/controller.decorator';
import { Get } from '../decorators/method.decorator';
import { HealthService } from './health.service';

@Controller('/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('/')
  check() {
    return this.healthService.check();
  }
}
