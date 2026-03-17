import 'reflect-metadata';
import {
  Injectable,
  NestInterceptor,
} from 'next-js-backend';

/**
 * TimingInterceptor — wraps response in { data, meta: { duration } }
 * NestInterceptor.intercept receives ExtendedContext and a next() handler
 */
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  async intercept(context: unknown, next: () => Promise<unknown>) {
    const start = Date.now();
    const result = await next();
    return {
      data: result,
      meta: { duration: `${Date.now() - start}ms`, timestamp: new Date().toISOString() },
    };
  }
}
