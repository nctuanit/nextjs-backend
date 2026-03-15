import type { AuthConfig } from '@auth/core';
import { Module } from '../../decorators/module.decorator';
import { NextAuthService, NEXTAUTH_CONFIG } from './nextauth.service';
import { NextAuthGuard } from './nextauth.guard';
import type { DynamicModule } from '../../interfaces';

/**
 * NextAuthModule integrates Auth.js (NextAuth v5) into the next-js-backend
 * dependency injection system.
 * 
 * @example
 * ```ts
 * import GitHub from '@auth/core/providers/github';
 * 
 * @Module({
 *   imports: [
 *     NextAuthModule.forRoot({
 *       providers: [
 *         GitHub({
 *           clientId: process.env.GITHUB_CLIENT_ID!,
 *           clientSecret: process.env.GITHUB_CLIENT_SECRET!,
 *         }),
 *       ],
 *       secret: process.env.AUTH_SECRET,
 *       trustHost: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NextAuthModule {
  /**
   * Register NextAuth with your Auth.js configuration.
   * 
   * @param config - The standard Auth.js configuration object
   * @returns DynamicModule with NextAuthService and NextAuthGuard
   */
  static forRoot(config: Omit<AuthConfig, 'raw'>): DynamicModule {
    return {
      module: NextAuthModule,
      providers: [
        {
          provide: NEXTAUTH_CONFIG,
          useValue: config,
        },
        {
          provide: NextAuthService,
          useFactory: () => {
            const service = new NextAuthService();
            service.setConfig(config as AuthConfig);
            return service;
          },
        },
        NextAuthGuard,
      ],
      exports: [NextAuthService, NextAuthGuard, NEXTAUTH_CONFIG],
    };
  }
}
