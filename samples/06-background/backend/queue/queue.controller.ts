import 'reflect-metadata';
import { Controller, Post, Get, Body } from 'next-js-backend';
import { QueueService } from 'next-js-backend';

@Controller('/queue')
export class QueueController {
  constructor(private readonly queue: QueueService) {}

  /**
   * POST /api/queue/email/send
   * Adds a 'send' job to the 'email' queue
   */
  @Post('/email/send')
  async addSend(@Body() body: { to: string; subject: string; body: string }) {
    const job = await this.queue.add('email', 'send', body);
    return { queued: true, jobId: job.id, queue: 'email', name: 'send' };
  }

  /**
   * POST /api/queue/email/notify
   * Adds a 'notify' job to the 'email' queue
   */
  @Post('/email/notify')
  async addNotify(@Body() body: { to: string; message: string }) {
    const job = await this.queue.add('email', 'notify', body);
    return { queued: true, jobId: job.id, queue: 'email', name: 'notify' };
  }

  /** GET /api/queue/status */
  @Get('/status')
  getStatus() {
    return {
      queue: 'email',
      pending: this.queue.getPendingCount('email'),
      active: this.queue.getActiveCount('email'),
    };
  }
}
