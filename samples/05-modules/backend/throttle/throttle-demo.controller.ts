import 'reflect-metadata';
import { Controller, Get } from 'next-js-backend';
import { Throttle, RateLimit } from 'next-js-backend';

@Controller('/throttle')
export class ThrottleDemoController {
  /** GET /api/throttle/limited — 5 requests per 60s */
  @Get('/limited')
  @Throttle({ limit: 5, ttl: 60 })
  getLimited() {
    return { message: 'Not throttled (yet) ✅', hint: 'Hit more than 5 times in 60s' };
  }

  /** GET /api/throttle/rate — 3 requests per 10s */
  @Get('/rate')
  @RateLimit({ max: 3, duration: 10 })
  getRate() {
    return { message: 'Not rate-limited (yet) ✅', hint: 'Hit more than 3 times in 10s' };
  }

  @Get('/open')
  getOpen() {
    return { message: 'No limits here', time: new Date().toISOString() };
  }
}
