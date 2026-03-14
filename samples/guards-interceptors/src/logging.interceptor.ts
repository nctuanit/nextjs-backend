import { Injectable, type NestInterceptor, type Context } from 'next-js-backend';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  async intercept(context: Context, next: () => Promise<unknown>) {
    console.log(`🟡 [LoggingInterceptor] Incoming Request: ${context.request.method} ${context.path}`);
    const start = Date.now();
    
    // Proceed to controller execution
    const result = await next();
    
    // Manipulate trailing response payload
    const timeTakenStr = `${Date.now() - start}ms`;
    console.log(`🟢 [LoggingInterceptor] Outgoing Response took ${timeTakenStr}`);
    
    if (typeof result === 'object' && result !== null) {
        return {
           ...result,
           _metadata: {
              processed_at: new Date().toISOString(),
              time_taken: timeTakenStr
           }
        };
    }
    
    return result;
  }
}
