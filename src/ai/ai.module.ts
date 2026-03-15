import type { Type } from '../di/provider';
import { AI_MODULE_CONFIG } from './ai.constants';
import { AiService } from './ai.service';
import type { AiModuleConfig } from './provider.interface';

/**
 * AI Module — NestJS-style dynamic module for registering AI capabilities.
 *
 * @example
 * ```ts
 * @Module({
 *   imports: [
 *     AiModule.register({
 *       providers: [
 *         { provider: 'openai', apiKey: process.env.OPENAI_API_KEY! },
 *       ],
 *       tools: [UserTools, ProductTools],
 *       agents: [SupportAgent],
 *     }),
 *   ],
 * })
 * class AppModule {}
 * ```
 */
export class AiModule {
  static register(config: AiModuleConfig): {
    module: Type<unknown>;
    providers: Array<{ provide: string; useValue: unknown } | Type<unknown>>;
  } {
    return {
      module: AiModule as unknown as Type<unknown>,
      providers: [
        {
          provide: AI_MODULE_CONFIG,
          useValue: config,
        },
        AiService as unknown as Type<unknown>,
      ],
    };
  }
}
