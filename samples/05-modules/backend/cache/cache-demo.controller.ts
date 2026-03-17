import 'reflect-metadata';
import { Controller, Get, UseInterceptors } from 'next-js-backend';
import { CacheInterceptor, CacheKey, CacheTTL } from 'next-js-backend';

@Controller('/cache')
export class CacheDemoController {
  private hitCount = 0;

  /** GET /api/cache/data — cached for 10s; hitCount only increments on real executions */
  @Get('/data')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('cache-demo')
  @CacheTTL(10)
  getData() {
    this.hitCount++;
    return {
      cached: true,
      ttl: '10s',
      serverHitCount: this.hitCount,
      generated: new Date().toISOString(),
      note: 'serverHitCount stays the same while cache is warm',
    };
  }

  /** GET /api/cache/live — not cached, always fresh */
  @Get('/live')
  getLive() {
    return { cached: false, time: new Date().toISOString() };
  }
}
