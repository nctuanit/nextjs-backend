import 'reflect-metadata';

export const PROCESSOR_METADATA = 'PROCESSOR_METADATA';
export const PROCESS_METADATA = 'PROCESS_METADATA';

/**
 * Mark a class as a job processor for the named queue.
 *
 * @example
 * ```ts
 * @Processor('emails')
 * @Injectable()
 * export class EmailProcessor {
 *   @Process('welcome')
 *   async sendWelcome(job: Job<{ email: string }>) { ... }
 * }
 * ```
 */
export function Processor(queueName: string): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(PROCESSOR_METADATA, queueName, target);
  };
}

/**
 * Mark a method as the handler for a specific job name within a `@Processor`.
 * If no `jobName` is given, it handles all jobs in the queue.
 */
export function Process(jobName?: string): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(PROCESS_METADATA, jobName ?? '*', descriptor.value);
    return descriptor;
  };
}
