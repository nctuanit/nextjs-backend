import 'reflect-metadata';
import { AI_WORKFLOW_METADATA, AI_STEP_METADATA } from '../ai.constants';
import type { WorkflowOptions, StepOptions } from '../ai.decorators';
import { WorkflowContext, type StepResult, type WorkflowResult } from './workflow.context';
import { Logger } from '../../services/logger.service';
import type { Type } from '../../di/provider';

// ─── Internal Step Definition ─────────────────────────────────────

interface StepDefinition {
  name: string;
  order: number;
  retries: number;
  parallel: boolean;
  when?: (ctx: WorkflowContext) => boolean;
  handler: (ctx: WorkflowContext) => Promise<unknown>;
}

// ─── Workflow Runtime ─────────────────────────────────────────────

/**
 * Executes `@Workflow` classes with `@Step` methods.
 * Supports: sequential execution, ordering, retries, conditional branching, parallel steps.
 */
export class WorkflowRuntime {
  private static readonly logger = new Logger('WorkflowRuntime');
  private static readonly RETRY_BASE_MS = 200;

  /**
   * Execute all @Step methods on a workflow instance.
   */
  static async execute(
    workflowInstance: object,
    initialContext?: Record<string, unknown>,
  ): Promise<WorkflowResult> {
    const constructor = Object.getPrototypeOf(workflowInstance).constructor as Type<unknown>;
    const workflowConfig: WorkflowOptions | undefined = Reflect.getMetadata(
      AI_WORKFLOW_METADATA,
      constructor,
    );

    const workflowName = workflowConfig?.name ?? constructor.name;
    const ctx = new WorkflowContext();

    // Seed initial context
    if (initialContext) {
      for (const [k, v] of Object.entries(initialContext)) {
        ctx.set(k, v);
      }
    }

    const steps = WorkflowRuntime.collectSteps(workflowInstance);
    const stepResults: StepResult[] = [];
    const startTime = Date.now();

    WorkflowRuntime.logger.log(`Starting workflow "${workflowName}" with ${steps.length} steps`);

    // Group steps by order for parallel execution
    const orderGroups = WorkflowRuntime.groupByOrder(steps);

    for (const [order, group] of orderGroups) {
      if (group.length === 1 || !group.every((s) => s.parallel)) {
        // Sequential
        for (const step of group) {
          const result = await WorkflowRuntime.executeStep(step, ctx, workflowName);
          stepResults.push(result);
          ctx.stepResults[step.name] = result.output;
          if (result.status === 'failed') {
            return {
              workflowName,
              status: 'failed',
              steps: stepResults,
              context: ctx.toObject(),
              duration: Date.now() - startTime,
            };
          }
        }
      } else {
        // Parallel — execute all steps in this order group simultaneously
        WorkflowRuntime.logger.log(
          `Workflow "${workflowName}": running ${group.length} steps in parallel (order=${order})`,
        );
        const parallelResults = await Promise.all(
          group.map((step) => WorkflowRuntime.executeStep(step, ctx, workflowName)),
        );
        for (const result of parallelResults) {
          stepResults.push(result);
          ctx.stepResults[result.stepName] = result.output;
        }
        const failed = parallelResults.find((r) => r.status === 'failed');
        if (failed) {
          return {
            workflowName,
            status: 'failed',
            steps: stepResults,
            context: ctx.toObject(),
            duration: Date.now() - startTime,
          };
        }
      }
    }

    WorkflowRuntime.logger.log(`Workflow "${workflowName}" completed in ${Date.now() - startTime}ms`);
    return {
      workflowName,
      status: 'completed',
      steps: stepResults,
      context: ctx.toObject(),
      duration: Date.now() - startTime,
    };
  }

  // ─── Private ────────────────────────────────────────────────────

  private static async executeStep(
    step: StepDefinition,
    ctx: WorkflowContext,
    workflowName: string,
  ): Promise<StepResult> {
    const start = Date.now();

    // Check conditional
    if (step.when && !step.when(ctx)) {
      WorkflowRuntime.logger.log(
        `Workflow "${workflowName}": step "${step.name}" skipped (when condition false)`,
      );
      return { stepName: step.name, status: 'skipped', duration: 0, attempts: 0 };
    }

    let lastError: Error | null = null;
    const maxAttempts = step.retries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        WorkflowRuntime.logger.log(
          `Workflow "${workflowName}": step "${step.name}" attempt ${attempt}/${maxAttempts}`,
        );
        const output = await step.handler(ctx);
        return {
          stepName: step.name,
          status: 'completed',
          output,
          duration: Date.now() - start,
          attempts: attempt,
        };
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        WorkflowRuntime.logger.error(
          `Workflow "${workflowName}": step "${step.name}" failed (attempt ${attempt}): ${lastError.message}`,
        );
        if (attempt < maxAttempts) {
          // Exponential backoff
          await new Promise((r) =>
            setTimeout(r, WorkflowRuntime.RETRY_BASE_MS * Math.pow(2, attempt - 1)),
          );
        }
      }
    }

    return {
      stepName: step.name,
      status: 'failed',
      error: lastError?.message,
      duration: Date.now() - start,
      attempts: maxAttempts,
    };
  }

  /** Collect all @Step decorated methods from an instance, sorted by order */
  private static collectSteps(instance: object): StepDefinition[] {
    const prototype = Object.getPrototypeOf(instance) as Record<string, unknown>;
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (m) => m !== 'constructor' && typeof prototype[m] === 'function',
    );

    const steps: StepDefinition[] = [];

    for (const methodName of methodNames) {
      const method = prototype[methodName] as (ctx: WorkflowContext) => Promise<unknown>;
      const stepConfig: StepOptions | undefined = Reflect.getMetadata(AI_STEP_METADATA, method);
      if (stepConfig) {
        steps.push({
          name: methodName,
          order: stepConfig.order ?? 0,
          retries: stepConfig.retries ?? 0,
          parallel: stepConfig.parallel ?? false,
          when: stepConfig.when,
          handler: method.bind(instance),
        });
      }
    }

    return steps.sort((a, b) => a.order - b.order);
  }

  /** Group steps by order number — steps with same order can run in parallel */
  private static groupByOrder(steps: StepDefinition[]): Map<number, StepDefinition[]> {
    const groups = new Map<number, StepDefinition[]>();
    for (const step of steps) {
      const group = groups.get(step.order) ?? [];
      group.push(step);
      groups.set(step.order, group);
    }
    return new Map([...groups.entries()].sort(([a], [b]) => a - b));
  }
}
