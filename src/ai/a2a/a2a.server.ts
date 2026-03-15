import type {
  AgentCard,
  Task,
  TaskSendParams,
  TaskGetParams,
  TaskCancelParams,
  JsonRpcRequest,
  JsonRpcResponse,
  A2AMessage,
  A2AEvent,
} from './a2a.types';
import type { AgentRuntime } from '../agent.runtime';
import type { ChatMessage } from '../provider.interface';
import { Logger } from '../../services/logger.service';

// ─── A2A Server Options ──────────────────────────────────────────

export interface A2AServerOptions {
  /** Agent runtime to expose */
  runtime: AgentRuntime;
  /** AgentCard metadata (describes capabilities to remote callers) */
  card: Omit<AgentCard, 'url' | 'version'>;
  /** Package version (auto-used in agent card) */
  version?: string;
}

// ─── A2A Server ──────────────────────────────────────────────────

/**
 * A2A Server — exposes your agents as a Google A2A-compatible HTTP endpoint.
 *
 * Mounts two routes:
 * - `GET  /.well-known/agent.json`  → AgentCard
 * - `POST /a2a`                     → JSON-RPC 2.0 handler (tasks/send, tasks/get, tasks/cancel)
 * - `POST /a2a` (streaming)         → SSE stream via tasks/sendSubscribe
 *
 * @example
 * ```ts
 * const a2aServer = new A2AServer({ runtime, card: { name: 'SupportAgent', ... } });
 * app.use(a2aServer.elysia()); // mount on Elysia instance
 * ```
 */
export class A2AServer {
  private static readonly logger = new Logger('A2AServer');
  /** In-memory task store with automatic eviction */
  private readonly tasks = new Map<string, Task & { _createdAt: number }>();
  /** Max tasks to hold in memory before evicting oldest (default: 1000) */
  private static readonly MAX_TASKS = 1_000;
  /** Task TTL in ms — completed tasks evicted after this (default: 1h) */
  private static readonly TASK_TTL_MS = 60 * 60 * 1_000;
  private readonly runtime: AgentRuntime;
  private readonly card: AgentCard;

  constructor(private readonly opts: A2AServerOptions) {
    this.runtime = opts.runtime;
    this.card = {
      ...opts.card,
      url: '', // set at mount time
      version: opts.version ?? '1.0.0',
      capabilities: {
        streaming: true,
        pushNotifications: false,
        stateTransitionHistory: true,
        ...opts.card.capabilities,
      },
    };
  }

  /** Store a task with eviction housekeeping */
  private storeTask(task: Task): void {
    const now = Date.now();
    // Evict expired tasks
    for (const [id, t] of this.tasks) {
      const isTerminal = t.status.state === 'completed' || t.status.state === 'failed' || t.status.state === 'canceled';
      if (isTerminal && now - t._createdAt > A2AServer.TASK_TTL_MS) {
        this.tasks.delete(id);
      }
    }
    // Evict oldest if still over limit
    if (this.tasks.size >= A2AServer.MAX_TASKS) {
      const oldestKey = this.tasks.keys().next().value;
      if (oldestKey) this.tasks.delete(oldestKey);
    }
    this.tasks.set(task.id, { ...task, _createdAt: now });
  }

  /** Handle AgentCard request */
  handleAgentCard(baseUrl: string): AgentCard {
    return { ...this.card, url: `${baseUrl}/a2a` };
  }

  /** Handle JSON-RPC request (non-streaming) */
  async handleJsonRpc(body: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      switch (body.method) {
        case 'tasks/send':
          return this.rpcOk(body.id, await this.handleTaskSend(body.params as unknown as TaskSendParams));
        case 'tasks/get':
          return this.rpcOk(body.id, await this.handleTaskGet(body.params as unknown as TaskGetParams));
        case 'tasks/cancel':
          return this.rpcOk(body.id, await this.handleTaskCancel(body.params as unknown as TaskCancelParams));
        default:
          return this.rpcError(body.id, -32601, `Method not found: ${body.method}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      A2AServer.logger.error(`A2A JSON-RPC error: ${message}`);
      return this.rpcError(body.id, -32603, message);
    }
  }

  /**
   * Handle streaming `tasks/sendSubscribe` — returns an AsyncGenerator of SSE events.
   */
  async *handleStream(params: TaskSendParams): AsyncGenerator<string> {
    const taskId = params.id || crypto.randomUUID();
    const agentName = this.resolveAgentName(params.message);

    // Initial status
    yield this.sseEvent({ id: taskId, status: { state: 'working', timestamp: new Date().toISOString() } });

    try {
      const input = this.extractTextInput(params.message);
      let fullResponse = '';

      for await (const chunk of this.runtime.stream(agentName, input, {
        history: this.convertHistory(params.message),
      })) {
        if (chunk.type === 'text' && chunk.content) {
          fullResponse += chunk.content;
          // Stream partial artifact
          yield this.sseEvent({
            id: taskId,
            artifact: {
              parts: [{ type: 'text', text: chunk.content }],
              append: true,
              lastChunk: false,
            },
          });
        } else if (chunk.type === 'done') {
          break;
        }
      }

      // Final status
      yield this.sseEvent({
        id: taskId,
        status: {
          state: 'completed',
          message: { role: 'agent', parts: [{ type: 'text', text: fullResponse }] },
          timestamp: new Date().toISOString(),
        },
        final: true,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      yield this.sseEvent({
        id: taskId,
        status: {
          state: 'failed',
          message: { role: 'agent', parts: [{ type: 'text', text: message }] },
          timestamp: new Date().toISOString(),
        },
        final: true,
      });
    }
  }

  // ─── Private ────────────────────────────────────────────────────

  private async handleTaskSend(params: TaskSendParams): Promise<Task> {
    const taskId = params.id || crypto.randomUUID();
    const agentName = this.resolveAgentName(params.message);
    const input = this.extractTextInput(params.message);

    const task: Task = {
      id: taskId,
      sessionId: params.sessionId,
      status: { state: 'working', timestamp: new Date().toISOString() },
    };
    this.storeTask(task);

    A2AServer.logger.log(`A2A task ${taskId}: running agent "${agentName}"`);

    try {
      const result = await this.runtime.run(agentName, input, {
        // Pass sessionId so AiService memory integration works end-to-end
        sessionId: params.sessionId,
      } as Parameters<AgentRuntime['run']>[2] & { sessionId?: string });

      task.status = {
        state: 'completed',
        message: { role: 'agent', parts: [{ type: 'text', text: result }] },
        timestamp: new Date().toISOString(),
      };
      task.artifacts = [{ parts: [{ type: 'text', text: result }] }];
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      task.status = {
        state: 'failed',
        message: { role: 'agent', parts: [{ type: 'text', text: message }] },
        timestamp: new Date().toISOString(),
      };
    }

    // Persist terminal state
    this.storeTask(task);
    return task;
  }

  private async handleTaskGet(params: TaskGetParams): Promise<Task> {
    const task = this.tasks.get(params.id);
    if (!task) {
      throw new Error(`Task "${params.id}" not found`);
    }
    return task;
  }

  private async handleTaskCancel(params: TaskCancelParams): Promise<Task> {
    const task = this.tasks.get(params.id);
    if (!task) throw new Error(`Task "${params.id}" not found`);
    task.status = { state: 'canceled', timestamp: new Date().toISOString() };
    return task;
  }

  /** Extract agent name from message metadata or first skill */
  private resolveAgentName(message: A2AMessage): string {
    const metaAgent = (message.metadata?.['agent'] as string) || '';
    if (metaAgent) return metaAgent;
    if (this.card.skills.length > 0) return this.card.skills[0]!.id;
    return this.card.name;
  }

  private extractTextInput(message: A2AMessage): string {
    return message.parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; text: string }).text)
      .join('\n');
  }

  /**
   * Convert A2AMessage history parts into ChatMessage[] for the runtime.
   * Extracts text parts from all message parts and maps roles.
   */
  private convertHistory(message: A2AMessage): ChatMessage[] {
    // The current A2A message itself is the user turn — history would come via
    // TaskSendParams.historyLength or a session store. For now we return empty
    // since history is managed by AiService memory when sessionId is used.
    void message;
    return [];
  }

  private rpcOk(id: JsonRpcRequest['id'], result: unknown): JsonRpcResponse {
    return { jsonrpc: '2.0', id: id ?? null, result };
  }

  private rpcError(id: JsonRpcRequest['id'], code: number, message: string): JsonRpcResponse {
    return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
  }

  private sseEvent(event: A2AEvent & { final?: boolean }): string {
    return `data: ${JSON.stringify(event)}\n\n`;
  }
}
