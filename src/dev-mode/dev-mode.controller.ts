import { Controller } from '../decorators/controller.decorator';
import { Get } from '../decorators/method.decorator';
import { DevModeService } from './dev-mode.service';

/**
 * Controller exposing the recorded request metrics and history.
 */
@Controller('/dev')
export class DevModeController {
  constructor(private readonly devModeService: DevModeService) {}

  @Get('/ping')
  ping() {
    return { status: 'dev-mode-active', timestamp: new Date() };
  }

  @Get('/stats')
  getOverallStats() {
    return this.devModeService.getStats();
  }

  @Get('/history')
  getHistory() {
    return this.devModeService.getHistory();
  }

  @Get('/history/clear')
  clearHistory() {
    this.devModeService.clearHistory();
    return { success: true, message: 'History cleared' };
  }
}
