/* eslint-disable @typescript-eslint/no-explicit-any */
import { Catch, HttpException } from 'next-js-backend';
import type { ExceptionFilter, ExtendedContext } from 'next-js-backend';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  // context typed as `any` to stay compatible with Elysia's Context union type
  catch(exception: HttpException, context: ExtendedContext) {
    const status = exception.status ?? 500;
    if (context?.set) context.set.status = status;
    return {
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    };
  }
}
