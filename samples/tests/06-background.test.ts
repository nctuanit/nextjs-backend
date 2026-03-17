import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'bun:test';
import { Test, TestRequestBuilder } from 'next-js-backend';
import { QueueService, EventEmitterService } from 'next-js-backend';
import { EmailProcessor } from '../06-background/backend/queue/email.processor';
import { QueueController } from '../06-background/backend/queue/queue.controller';
import { ScheduleService } from '../06-background/backend/schedule/schedule.service';
import { ScheduleController } from '../06-background/backend/schedule/schedule.controller';

describe('06-background', () => {
  let app: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>['createApp']>>;
  let scheduleSvc: ScheduleService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [QueueController, ScheduleController],
      providers: [
        EmailProcessor,            // must be registered before QueueService wires up
        QueueService,
        ScheduleService,
        EventEmitterService,
      ],
    }).compile();

    scheduleSvc = await moduleRef.get(ScheduleService);
    app = await moduleRef.createApp();
  });

  // ── EmailProcessor unit tests ─────────────────────────
  describe('EmailProcessor', () => {
    it('processes a send job successfully', async () => {
      const processor = new EmailProcessor();
      const mockJob = { id: '1', data: { to: 'user@test.com', subject: 'Test', body: 'Hello' } } as any;
      const result = await processor.send(mockJob);
      expect(result.sent).toBe(true);
      expect(result.to).toBe('user@test.com');
    });

    it('processes a notify job', async () => {
      const processor = new EmailProcessor();
      const mockJob = { id: '2', data: { to: 'user@test.com', message: 'Notification' } } as any;
      const result = await processor.notify(mockJob);
      expect(result.notified).toBe(true);
    });
  });

  // ── ScheduleService unit tests ────────────────────────
  describe('ScheduleService', () => {
    it('getLog returns empty array initially', () => {
      const svc = new ScheduleService(new EventEmitterService());
      const log = svc.getLog();
      expect(Array.isArray(log)).toBe(true);
    });

    it('log gets an entry after calling onCron() manually', async () => {
      const svc = new ScheduleService(new EventEmitterService());
      // Call onCron() directly (it's a public method decorated with @Cron)
      await (svc as any).onCron();
      const log = svc.getLog();
      expect(log.length).toBe(1);
      expect(log[0].tick).toBe(1);
      expect(log[0].at).toBeDefined();
    });

    it('log has reversed order (newest first)', async () => {
      const svc = new ScheduleService(new EventEmitterService());
      await (svc as any).onCron();
      await (svc as any).onCron();
      const log = svc.getLog();
      expect(log[0].tick).toBe(2); // newest first
      expect(log[1].tick).toBe(1);
    });
  });

  // ── HTTP integration tests ────────────────────────────
  describe('POST /queue/email/send', () => {
    it('enqueues send job and returns jobId', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/queue/email/send').method('POST').headers({ 'Content-Type': 'application/json' }).body({ to: 'test@test.com', subject: 'Test', body: 'Hello' }).build());
      expect(res.status).toBe(200);
      const body = await res.json() as { queued: boolean; jobId: string; queue: string; name: string };
      expect(body.queued).toBe(true);
      expect(body.jobId).toBeDefined();
      expect(body.queue).toBe('email');
      expect(body.name).toBe('send');
    });
  });

  describe('POST /queue/email/notify', () => {
    it('enqueues notify job', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/queue/email/notify').method('POST').headers({ 'Content-Type': 'application/json' }).body({ to: 'test@test.com', message: 'Hello notification' }).build());
      expect(res.status).toBe(200);
      const body = await res.json() as { queued: boolean; name: string };
      expect(body.queued).toBe(true);
      expect(body.name).toBe('notify');
    });
  });

  describe('GET /queue/status', () => {
    it('returns queue status object', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/queue/status').build());
      expect(res.status).toBe(200);
      const body = await res.json() as { queue: string; pending: number; active: number };
      expect(body.queue).toBe('email');
      expect(typeof body.pending).toBe('number');
      expect(typeof body.active).toBe('number');
    });
  });

  describe('GET /schedule/log', () => {
    it('returns schedule log', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/schedule/log').build());
      expect(res.status).toBe(200);
      const body = await res.json() as { description: string; count: number; entries: unknown[] };
      expect(typeof body.description).toBe('string');
      expect(typeof body.count).toBe('number');
      expect(Array.isArray(body.entries)).toBe(true);
    });
  });
});
