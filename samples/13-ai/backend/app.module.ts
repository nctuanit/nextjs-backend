import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { AiController } from './ai/ai.controller';

/**
 * For real AI: replace with AiModule from next-js-backend
 *
 * import { AiModule } from 'next-js-backend';
 *
 * @Module({
 *   imports: [
 *     AiModule.register({
 *       providers: [{ provider: 'openai', apiKey: process.env.OPENAI_API_KEY! }],
 *       agents: [SupportAgent],
 *       tools: [WeatherTool],
 *     }),
 *   ],
 *   controllers: [AiController],
 * })
 */
@Module({
  controllers: [AiController],
})
export class AppModule {}
