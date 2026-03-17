import 'reflect-metadata';
import { Controller, Get } from 'next-js-backend';

@Controller('/compression')
export class CompressionDemoController {
  /**
   * GET /api/compression/payload
   * Returns 500 items — CompressionModule compresses response when threshold exceeded
   */
  @Get('/payload')
  getPayload() {
    return {
      note: 'Check "Content-Encoding: gzip" in Network tab when Accept-Encoding is sent',
      count: 500,
      items: Array.from({ length: 500 }, (_, i) => ({ id: i, value: `item-${i}`, data: 'x'.repeat(50) })),
    };
  }
}
