import { Injectable } from 'next-js-backend';
import { Processor, Process, Logger } from 'next-js-backend';
import type { Job } from 'next-js-backend';

/**
 * @Processor('email') — processes jobs from the 'email' queue
 * @Process('send') — handles jobs named 'send'
 */
@Processor('email')
@Injectable()
export class EmailProcessor {
  @Process('send')
  async send(job: Job<{ to: string; subject: string; body: string }>) {
    // Simulate async email send
    await new Promise(r => setTimeout(r, 150));
    Logger.log(`[EmailProcessor] Sent to ${job.data.to}: "${job.data.subject}"`);
    return { sent: true, to: job.data.to };
  }

  @Process('notify')
  async notify(job: Job<{ to: string; message: string }>) {
    await new Promise(r => setTimeout(r, 100));
    Logger.log(`[EmailProcessor] Notified ${job.data.to}: "${job.data.message}"`);
    return { notified: true };
  }
}
