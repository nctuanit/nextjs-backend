import { DynamicModule } from '../interfaces';
import { Module } from '../decorators/module.decorator';
import cors, { type CORSConfig } from '@elysiajs/cors';
import { helmet } from 'elysia-helmet';

export interface PluginsModuleOptions {
  /**
   * Enable & Configure CORS (Cross-Origin Resource Sharing).
   * Set to `true` for defaults or provide custom CORS config.
   */
  cors?: boolean | CORSConfig;

  /**
   * Enable & Configure Helmet (Security Headers).
   * Set to `true` for defaults or provide Helmet Options.
   */
  helmet?: boolean | Record<string, any>;
}

export const PLUGINS_CONFIG = 'PLUGINS_CONFIG';

@Module({})
export class PluginsModule {
  /**
   * Registers global core plugins for the application.
   * Note: Rate Limit runs slightly differently since it can be route-specific.
   */
  static register(options?: PluginsModuleOptions): DynamicModule {
    // Generate the providers for config
    return {
      module: PluginsModule,
      providers: [
        {
          provide: PLUGINS_CONFIG,
          useValue: options || {},
        },
      ],
      exports: [PLUGINS_CONFIG],
    };
  }
}
