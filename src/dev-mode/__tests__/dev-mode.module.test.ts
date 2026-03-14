import { describe, it, expect } from 'bun:test';
import { ElysiaFactory } from '../../factory/elysia-factory';
import { Controller } from '../../decorators/controller.decorator';
import { Get, Post } from '../../decorators/method.decorator';
import { DevModeModule } from '../dev-mode.module';
import { DevModeService } from '../dev-mode.service';
import { Module } from '../../decorators/module.decorator';
import { globalContainer } from '../../di/container';
import { Body } from '../../decorators/param.decorator';

describe('DevMode Request Profiler', () => {
  @Controller('/dev-target')
  class TargetController {
    @Get('/fast')
    fastRoute() {
      return { success: true };
    }

    @Post('/data')
    dataRoute(@Body() body: any) {
      return { received: body };
    }
    
    @Get('/error')
    errorRoute() {
        throw new Error('Test Error');
    }
  }

  @Module({
    imports: [
      DevModeModule.register({ enabled: true, maxHistory: 10 })
    ],
    controllers: [TargetController]
  })
  class TestDevAppModule {}

  it('should collect successful GET request telemetry', async () => {
    const app = await ElysiaFactory.create(TestDevAppModule);
    const service = await globalContainer.resolve(DevModeService) as DevModeService;
    
    // reset from prev runs
    service.clearHistory();

    const response = await app.handle(new Request('http://localhost/dev-target/fast?search=dev'));
    await new Promise(resolve => setTimeout(resolve, 10)); // wait for background hook
    expect(response.status).toBe(200);

    const history = service.getHistory();
    expect(history.length).toBe(1);

    const profile = history[0]!;
    expect(profile.method).toBe('GET');
    expect(profile.url).toBe('/dev-target/fast');
    expect(profile.status).toBe(200);
    expect(profile.query?.search).toBe('dev');
    expect(profile.durationMs).toBeGreaterThan(0);
    
    const stats = service.getStats();
    expect(stats.totalRequests).toBe(1);
    expect(stats.errorRate).toBe(0);
  });

  it('should capture request body for POST routes', async () => {
    const app = await ElysiaFactory.create(TestDevAppModule);
    const service = await globalContainer.resolve(DevModeService) as DevModeService;
    service.clearHistory();

    const payload = JSON.stringify({ item: 'test_payload' });
    const response = await app.handle(new Request('http://localhost/dev-target/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: 'test_payload' })
    }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(response.status).toBe(200);

    const profile = service.getHistory()[0]!;
    expect(profile.method).toBe('POST');
    // We expect the raw middleware to capture text/json if possible
    expect(profile.body).toEqual({ item: 'test_payload' });
  });

  it('should drop old requests when maxHistory limit is reached', async () => {
     const app = await ElysiaFactory.create(TestDevAppModule);
     const service = await globalContainer.resolve(DevModeService) as DevModeService;
     service.clearHistory();

     // Fire 15 requests (max configured is 10)
     for(let i=0; i<15; i++) {
        await app.handle(new Request('http://localhost/dev-target/fast'));
     }
     await new Promise(resolve => setTimeout(resolve, 10));

     const history = service.getHistory();
     // History length should ceiling at exactly 10 items
     expect(history.length).toBe(10);
  });

  it('should calculate error rate metrics appropriately', async () => {
    const app = await ElysiaFactory.create(TestDevAppModule);
    const service = await globalContainer.resolve(DevModeService) as DevModeService;
    service.clearHistory();

    await app.handle(new Request('http://localhost/dev-target/fast'));
    await app.handle(new Request('http://localhost/dev-target/fast')).catch(() => {});
    await app.handle(new Request('http://localhost/dev-target/error')).catch(() => {}); // Will hit 500 error handler
    await app.handle(new Request('http://localhost/dev-target/error')).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 10));

    const stats = service.getStats();
    expect(stats.totalRequests).toBe(4);
    
    // 2 errors / 4 requests = 50% Error Rate
    expect(stats.errorRate).toBe(50);
  });
});
