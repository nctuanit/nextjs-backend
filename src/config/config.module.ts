import { Module } from '../decorators/module.decorator';
import { type DynamicModule } from '../interfaces';
import { ConfigService, type ConfigModuleOptions } from './config.service';

@Module({})
export class ConfigModule {
  /**
   * Bootstraps the ConfigModule.
   * 
   * @param options Configuration options including TypeBox schema
   */
  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: ConfigService,
          useFactory: () => new ConfigService(options),
        }
      ],
      exports: [ConfigService]
    };
  }
}
