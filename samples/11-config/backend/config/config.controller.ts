import 'reflect-metadata';
import { Controller, Get } from 'next-js-backend';
import { ConfigService } from 'next-js-backend';

@Controller('/config')
export class ConfigController {
  constructor(private readonly config: ConfigService) {}

  /** GET /api/config/all — show all resolved env vars (safe subset) */
  @Get('/all')
  getAll() {
    return {
      appName: this.config.get('APP_NAME', 'next-js-backend demo'),
      appPort: this.config.get('APP_PORT', '3011'),
      nodeEnv: this.config.get('NODE_ENV', 'development'),
      logLevel: this.config.get('LOG_LEVEL', 'info'),
    };
  }

  /** GET /api/config/env — raw NODE_ENV */
  @Get('/env')
  getEnv() {
    return {
      nodeEnv: this.config.get('NODE_ENV'),
      isDev: this.config.get('NODE_ENV') === 'development',
    };
  }

  /** GET /api/config/get?key=... — fetch a specific key */
  @Get('/get')
  getKey() {
    // Demo: return a computed config value
    return {
      APP_NAME: this.config.get('APP_NAME', 'next-js-backend'),
      APP_PORT: this.config.get('APP_PORT', '3011'),
      DATABASE_URL: this.config.get('DATABASE_URL', '(not set — use .env to configure)'),
      REDIS_URL: this.config.get('REDIS_URL', '(not set — use .env to configure)'),
      JWT_SECRET: this.config.get('JWT_SECRET') ? '****** (set)' : '(not set)',
    };
  }
}
