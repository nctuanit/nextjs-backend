import 'reflect-metadata';
import { Controller, Get, Post, Body } from 'next-js-backend';

@Controller('/demo')
export class DemoController {
  private log: string[] = [];

  @Get('/hello')
  hello() {
    const msg = `Hello at ${new Date().toISOString()}`;
    this.log.push(msg);
    return { message: msg, requestCount: this.log.length };
  }

  @Get('/error')
  triggerError() {
    throw new Error('Intentional error for dev-mode logging demo');
  }

  @Post('/echo')
  echo(@Body() body: unknown) {
    return { echo: body, receivedAt: new Date().toISOString() };
  }

  @Get('/log')
  getLog() {
    return { entries: this.log, count: this.log.length };
  }
}
