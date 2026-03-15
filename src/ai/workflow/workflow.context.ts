// ─── Workflow Context ─────────────────────────────────────────────

/**
 * Shared state object passed between workflow steps.
 * Type-safe key-value store with get/set/has/delete operations.
 */
export class WorkflowContext {
  private state = new Map<string, unknown>();
  readonly stepResults: Record<string, unknown> = {};

  /** Store a value in context */
  set<T>(key: string, value: T): void {
    this.state.set(key, value);
  }

  /** Retrieve a typed value from context */
  get<T>(key: string): T | undefined {
    return this.state.get(key) as T | undefined;
  }

  /** Retrieve value, throw if missing */
  require<T>(key: string): T {
    if (!this.state.has(key)) {
      throw new Error(`WorkflowContext: required key "${key}" not found`);
    }
    return this.state.get(key) as T;
  }

  /** Check if key exists */
  has(key: string): boolean {
    return this.state.has(key);
  }

  /** Delete a key */
  delete(key: string): void {
    this.state.delete(key);
  }

  /** Get all context as a plain object */
  toObject(): Record<string, unknown> {
    return Object.fromEntries(this.state.entries());
  }
}

// ─── Step Execution Result ────────────────────────────────────────

export interface StepResult {
  stepName: string;
  status: 'completed' | 'skipped' | 'failed';
  output?: unknown;
  error?: string;
  duration: number;
  attempts: number;
}

export interface WorkflowResult {
  workflowName: string;
  status: 'completed' | 'failed';
  steps: StepResult[];
  context: Record<string, unknown>;
  duration: number;
}
