import { describe, expect, it } from 'bun:test';
import { Type as t } from '@sinclair/typebox';
import { ConfigModule, ConfigService } from '../../src/config';
import { globalContainer } from '../../src/di/container';
import { ElysiaFactory } from '../../src/factory/elysia-factory';
import { Module } from '../../src/decorators/module.decorator';

describe('ConfigModule & Dynamic Modules', () => {
  it('should parse, validate and inject complex environment variables', async () => {
    // Reset container for clean slate
    globalContainer['providers'].clear();

    const envSchema = t.Object({
      PORT: t.Number({ default: 3000 }),
      NODE_ENV: t.String({ default: 'development' }),
      IS_PROD: t.Boolean({ default: false }),
      API_KEY: t.String(),
    });

    @Module({
      imports: [
        ConfigModule.forRoot({
          schema: envSchema,
          load: {
            API_KEY: 'secret-key',
            IS_PROD: 'true', // string should be coerced to boolean
            PORT: '8080',    // string should be coerced to number
          }
        })
      ]
    })
    class AppModule {}

    // Bootstrap app to trigger dynamic module registration
    await ElysiaFactory.create(AppModule);

    // Get the injected ConfigService
    const configService = await globalContainer.resolve(ConfigService) as ConfigService<any>;

    // Verify conversions and defaults
    expect((configService as any).get('API_KEY')).toBe('secret-key');
    expect((configService as any).get('PORT')).toBe(8080);
    expect((configService as any).get('IS_PROD')).toBe(true);
    expect((configService as any).get('NODE_ENV')).toBe('development'); // Applied default
  });

  it('should throw error on invalid configuration', async () => {
    globalContainer['providers'].clear();

    const envSchema = t.Object({
      REQUIRED_KEY: t.String(),
    });

    @Module({
      imports: [
        ConfigModule.forRoot({
          schema: envSchema,
          load: {} // missing REQUIRED_KEY
        })
      ]
    })
    class FailingModule {}

    let errorThrown = false;
    try {
      await ElysiaFactory.create(FailingModule);
    } catch (e: any) {
      errorThrown = true;
      expect(e.message).toBe('Config validation error');
    }

    expect(errorThrown).toBe(true);
  });
});
