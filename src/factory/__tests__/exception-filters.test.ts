import { expect, test, describe } from 'bun:test';
import { Controller } from '../../decorators/controller.decorator';
import { Get } from '../../decorators/method.decorator';
import { Catch } from '../../decorators/catch.decorator';
import { UseFilters } from '../../decorators/filter.decorator';
import { Module } from '../../decorators/module.decorator';
import { Injectable } from '../../di/injectable.decorator';
import { ElysiaFactory } from '../elysia-factory';
import { ExceptionFilter } from '../../interfaces';
import { TestRequestBuilder } from '../../testing/request-builder';


class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomError';
  }
}

@Injectable()
@Catch(CustomError)
class CustomErrorFilter implements ExceptionFilter {
  catch(exception: CustomError, context: any) {
    context.set.status = 418;
    return {
      caught: true,
      message: exception.message,
    };
  }
}

@Injectable()
@Catch() // empty catch all
class GlobalFallbackFilter implements ExceptionFilter {
  catch(exception: Error, context: any) {
    context.set.status = 500;
    return {
      fromGlobal: true,
      msg: 'Something went wrong',
    };
  }
}

@Controller('/errors')
class ErrorController {
  @Get('/custom')
  @UseFilters(CustomErrorFilter)
  throwCustom() {
    throw new CustomError('This is a custom error');
  }

  @Get('/unhandled')
  throwUnhandled() {
    throw new Error('This should hit global');
  }
  
  @Get('/success')
  success() {
    return { ok: true };
  }
}

@Module({
  controllers: [ErrorController],
  providers: [CustomErrorFilter, GlobalFallbackFilter]
})
class ErrorModule {}

describe('Exception Filters', () => {
  test('should catch specific error via local @UseFilters', async () => {
    const app = await ElysiaFactory.create(ErrorModule);
    const req = new TestRequestBuilder().path('/errors/custom').build();
    const res = await app.handle(req);
    const json = await res.json() ;
    
    expect(res.status).toBe(418);
    expect(json.caught).toBe(true);
    expect(json.message).toBe('This is a custom error');
  });

  test('should catch unhandled error via global filter', async () => {
    const app = await ElysiaFactory.create(ErrorModule, {
      globalFilters: [GlobalFallbackFilter]
    });
    const req = new TestRequestBuilder().path('/errors/unhandled').build();
    const res = await app.handle(req);
    const json = await res.json() ;
    
    expect(res.status).toBe(500);
    expect(json.fromGlobal).toBe(true);
  });
  
  test('should not interfere with successful requests', async () => {
    const app = await ElysiaFactory.create(ErrorModule, {
      globalFilters: [GlobalFallbackFilter]
    });
    const req = new TestRequestBuilder().path('/errors/success').build();
    const res = await app.handle(req);
    const json = await res.json() ;
    
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
  });
});
