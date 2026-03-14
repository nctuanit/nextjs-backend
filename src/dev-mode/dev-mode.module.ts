import { DynamicModule } from '../interfaces';
import { Module } from '../decorators/module.decorator';
import { DevModeService, DEV_MODE_CONFIG, type DevModeConfig } from './dev-mode.service';
import { DevModeController } from './dev-mode.controller';
import { DevModeLoggerMiddleware } from './dev-mode.middleware';

@Module({})
export class DevModeModule {
  static register(config: DevModeConfig = { enabled: false }): DynamicModule {
    if (!config.enabled) {
      // Return empty module if disabled to not affect production runtimes
      return {
        module: DevModeModule,
        controllers: [],
        providers: [],
      };
    }

    // Pass configuration down
    return {
      module: DevModeModule,
      controllers: [DevModeController],
      providers: [
        {
          provide: DEV_MODE_CONFIG,
          useValue: config
        },
        DevModeService,
        DevModeLoggerMiddleware // Added as provider so it can be DI instantiated
      ],
      exports: [DevModeService]
    };
  }
}
