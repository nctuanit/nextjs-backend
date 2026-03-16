import { Injectable } from '../di/injectable.decorator';

export interface Job<T = unknown> {
  id: string;
  queue: string;
  name: string;
  data: T;
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  failedReason?: string;
}

export interface QueueJobOptions {
  /** Max retry attempts on failure. Default: 3 */
  retries?: number;
  /** Delay (ms) before first retry. Doubles each attempt (exponential backoff). Default: 1000 */
  backoffMs?: number;
  /** Priority: lower = higher priority. Default: 0 */
  priority?: number;
}

type JobProcessor = (job: Job) => Promise<unknown>;

interface QueueEntry {
  job: Job;
  processor: JobProcessor;
  options: Required<QueueJobOptions>;
}

/**
 * In-process FIFO job queue with concurrency control and exponential backoff retries.
 * Drop-in for simple background workloads; swap out for BullMQ for production-scale needs.
 */
@Injectable()
export class QueueService {
  private readonly queues = new Map<string, QueueEntry[]>();
  private readonly processors = new Map<string, Map<string, JobProcessor>>();
  private readonly running = new Map<string, number>();
  private readonly concurrency: number;

  constructor(concurrency = 5) {
    this.concurrency = concurrency;
  }

  /** Register a named job processor */
  registerProcessor(queueName: string, jobName: string, fn: JobProcessor): void {
    if (!this.processors.has(queueName)) {
      this.processors.set(queueName, new Map());
    }
    this.processors.get(queueName)!.set(jobName, fn);
  }

  /**
   * Add a job to the queue.
   * @returns The created Job object
   */
  async add<T>(queueName: string, jobName: string, data: T, options?: QueueJobOptions): Promise<Job<T>> {
    const processor = this.processors.get(queueName)?.get(jobName)
      ?? this.processors.get(queueName)?.get('*');

    if (!processor) {
      throw new Error(`No processor registered for queue="${queueName}" job="${jobName}". Did you register a @Processor?`);
    }

    const job: Job<T> = {
      id: crypto.randomUUID(),
      queue: queueName,
      name: jobName,
      data,
      attempts: 0,
      createdAt: new Date(),
    };

    const opts: Required<QueueJobOptions> = {
      retries: options?.retries ?? 3,
      backoffMs: options?.backoffMs ?? 1000,
      priority: options?.priority ?? 0,
    };

    const queue = (this.queues.get(queueName) ?? []);
    queue.push({ job: job as Job, processor, options: opts });
    // Sort by priority (lower = first)
    queue.sort((a, b) => a.options.priority - b.options.priority);
    this.queues.set(queueName, queue);

    this.runQueue(queueName);
    return job;
  }

  private async runQueue(queueName: string): Promise<void> {
    const current = this.running.get(queueName) ?? 0;
    if (current >= this.concurrency) return;

    const queue = this.queues.get(queueName);
    if (!queue?.length) return;

    const entry = queue.shift()!;
    this.running.set(queueName, (this.running.get(queueName) ?? 0) + 1);

    this.executeJob(entry).finally(() => {
      this.running.set(queueName, Math.max(0, (this.running.get(queueName) ?? 1) - 1));
      this.runQueue(queueName);
    });
  }

  private async executeJob(entry: QueueEntry, attempt = 0): Promise<void> {
    const { job, processor, options } = entry;
    job.attempts = attempt + 1;

    try {
      job.processedAt = new Date();
      await processor(job);
    } catch (err) {
      job.failedReason = String(err);
      if (attempt < options.retries) {
        const delay = options.backoffMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        await this.executeJob(entry, attempt + 1);
      } else {
        console.error(`[Queue:${job.queue}] Job ${job.id} (${job.name}) failed after ${job.attempts} attempt(s):`, err);
      }
    }
  }

  /** Get count of pending jobs for a queue */
  getPendingCount(queueName: string): number {
    return this.queues.get(queueName)?.length ?? 0;
  }

  /** Get count of actively running jobs for a queue */
  getActiveCount(queueName: string): number {
    return this.running.get(queueName) ?? 0;
  }
}
