import { describe, expect, it, beforeAll } from 'bun:test';
import { type Context } from 'elysia';
import { Controller, Get, ElysiaFactory } from '../../index';
import { UseFilters, Catch, HttpException, Injectable } from '../../index';
import { type ExceptionFilter } from '../../src/interfaces';
import { Module } from '../../index';

class CustomDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomDomainError';
  }
}

class AnotherError extends Error {}

@Catch(CustomDomainError)
@Injectable()
class CustomDomainExceptionFilter implements ExceptionFilter {
  catch(exception: CustomDomainError, context: Context) {
    context.set.status = 418; // I'm a teapot
    return {
      success: false,
      errorType: 'CustomDomainError',
      message: exception.message,
      handledByFilter: true
    };
  }
}

@Catch(HttpException)
@Injectable()
class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, context: Context) {
    context.set.status = exception.status;
    return {
      success: false,
      timestamp: new Date().toISOString(),
      path: context.request.url,
      message: exception.response
    };
  }
}

@Controller('/filters')
@UseFilters(GlobalHttpExceptionFilter)
class FilterController {
  @Get('/custom-domain-error')
  @UseFilters(CustomDomainExceptionFilter)
  throwCustomDomainError() {
    throw new CustomDomainError('This is a domain specific problem');
  }

  @Get('/http-error')
  throwHttpError() {
    throw new HttpException('Not allowed action', 403);
  }

  @Get('/unhandled-error')
  throwUnhandledError() {
    throw new AnotherError('This should be handled by built-in Elysia/Nest error handler');
  }
}

@Module({
  controllers: [FilterController],
  providers: [CustomDomainExceptionFilter, GlobalHttpExceptionFilter]
})
class FilterModule {}

describe('E2E Exception Filters (@Catch, @UseFilters)', () => {
  let app: Awaited<ReturnType<typeof ElysiaFactory.create>>;

  beforeAll(async () => {
    app = await ElysiaFactory.create(FilterModule);
  });

  const req = (path: string, options?: RequestInit) =>
    app.handle(new Request(`http://localhost${path}`, options));

  it('should handle custom domain error with CustomDomainExceptionFilter', async () => {
    const res = await req('/filters/custom-domain-error');
    expect(res.status).toBe(418);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errorType).toBe('CustomDomainError');
    expect(body.message).toBe('This is a domain specific problem');
    expect(body.handledByFilter).toBe(true);
  });

  it('should handle HttpException with GlobalHttpExceptionFilter (controller-level)', async () => {
    const res = await req('/filters/http-error');
    expect(res.status).toBe(403);
    const body = await res.json() ;
    expect(body.success).toBe(false);
    expect(body.message).toBe('Not allowed action');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('path');
  });

  it('should fallback to default error handler for unhandled errors', async () => {
    const res = await req('/filters/unhandled-error');
    expect(res.status).toBe(500);
    const body = await res.json() ;
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('This should be handled by built-in Elysia/Nest error handler');
  });
});
