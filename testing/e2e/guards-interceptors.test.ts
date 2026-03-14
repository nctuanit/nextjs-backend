import { describe, expect, it, beforeAll } from 'bun:test';
import { type Context } from 'elysia';
import { Controller, Get, ElysiaFactory } from '../../index';
import { UseGuards, UseInterceptors, ForbiddenException, BadRequestException, HttpException, Injectable } from '../../index';
import { type CanActivate, type NestInterceptor } from '../../src/interfaces';
import { Module } from '../../index';

@Injectable()
class AuthGuard implements CanActivate {
  canActivate(context: Context): boolean {
    const auth = context.headers['authorization'];
    return auth === 'Bearer valid_token';
  }
}

@Injectable()
class TransformInterceptor implements NestInterceptor {
  async intercept(context: Context, next: () => Promise<unknown>) {
    const result = await next();
    if (typeof result === 'object' && result !== null) {
      return { ...result, intercepted: true };
    }
    return result;
  }
}

@Controller('/middleware')
class MiddlewareController {
  @Get('/error')
  throwError() {
    throw new BadRequestException('Custom Error');
  }

  @Get('/custom-error-payload')
  throwCustomPayload() {
    throw new HttpException({ errorCode: 'VALIDATION_FAILED', details: ['field1', 'field2'] }, 422);
  }

  @Get('/protected')
  @UseGuards(AuthGuard)
  getProtected() {
    return { sensitive: 'data' };
  }

  @Get('/intercepted')
  @UseInterceptors(TransformInterceptor)
  getIntercepted() {
    return { data: 'raw' };
  }

  @Get('/combined')
  @UseGuards(AuthGuard)
  @UseInterceptors(TransformInterceptor)
  getCombined() {
    return { data: 'hybrid' };
  }
}

@Controller('/controller-level')
@UseGuards(AuthGuard)
@UseInterceptors(TransformInterceptor)
class ControllerLevelMiddleware {
  @Get()
  getGuardedIntercepted() {
    return { success: true };
  }
}

@Module({
  controllers: [MiddlewareController, ControllerLevelMiddleware],
  providers: [AuthGuard, TransformInterceptor]
})
class MiddlewareModule {}

describe('E2E Guards, Interceptors & Exceptions', () => {
  let app: Awaited<ReturnType<typeof ElysiaFactory.create>>; 
  
  beforeAll(async () => {
    app = await ElysiaFactory.create(MiddlewareModule);
  });
  
  const req = (path: string, options?: RequestInit) => 
    app.handle(new Request(`http://localhost${path}`, options));

  it('should auto-serialize HttpExceptions into status codes and payloads', async () => {
    const res = await req('/middleware/error');
    expect(res.status).toBe(400); // BadRequestException
    expect(await res.text()).toBe('Custom Error');
  });

  it('should auto-serialize HttpExceptions with complex object payloads', async () => {
    const res = await req('/middleware/custom-error-payload');
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ errorCode: 'VALIDATION_FAILED', details: ['field1', 'field2'] });
  });

  it('should block requests without valid Guard authorization', async () => {
    const res = await req('/middleware/protected', {
      headers: { authorization: 'Bearer bad_token' }
    });
    expect(res.status).toBe(403);
    expect(await res.text()).toBe('Forbidden resource');
  });

  it('should allow requests passing Guard authorization', async () => {
    const res = await req('/middleware/protected', {
      headers: { authorization: 'Bearer valid_token' }
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sensitive: 'data' });
  });

  it('should mutate response using UseInterceptors next() wrapper', async () => {
    const res = await req('/middleware/intercepted');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: 'raw', intercepted: true });
  });

  it('should execute both generic Guard and Interceptor together', async () => {
    const res = await req('/middleware/combined', {
      headers: { authorization: 'Bearer valid_token' }
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: 'hybrid', intercepted: true }); // both passed
  });

  it('should apply guards and interceptors defined at the Controller class level', async () => {
    // Fail guard
    let res = await req('/controller-level', {
      headers: { authorization: 'Bearer bad_token' }
    });
    expect(res.status).toBe(403);
    
    // Pass guard, trigger interceptor
    res = await req('/controller-level', {
      headers: { authorization: 'Bearer valid_token' }
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, intercepted: true });
  });
});
