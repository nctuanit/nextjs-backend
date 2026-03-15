import type {
  AgentCard,
  Task,
  TaskSendParams,
  TaskGetParams,
  TaskCancelParams,
  JsonRpcRequest,
  JsonRpcResponse,
  A2AMessage,
} from './a2a.types';

// ─── A2A Client ──────────────────────────────────────────────────

export interface A2AClientOptions {
  /** Base URL of the remote A2A agent (e.g. "https://agents.example.com") */
  baseUrl: string;
  /** Optional API key sent as Bearer token */
  apiKey?: string;
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number;
}

/**
 * A2A Client — call any A2A-compatible agent over HTTP.
 * Supports task creation, polling, cancellation, and SSE streaming.
 *
 * @example
 * ```ts
 * const client = new A2AClient({ baseUrl: 'https://remote-agent.example.com' });
 * const card = await client.getAgentCard();
 * const task = await client.sendTask({
 *   id: crypto.randomUUID(),
 *   message: { role: 'user', parts: [{ type: 'text', text: 'Hello!' }] },
 * });
 * ```
 */
export class A2AClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(private readonly opts: A2AClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.headers = {
      'Content-Type': 'application/json',
      ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
    };
  }

  // ─── Agent Discovery ─────────────────────────────────────────────

  /** Fetch the remote agent's capabilities card */
  async getAgentCard(): Promise<AgentCard> {
    const res = await this.fetch(`${this.baseUrl}/.well-known/agent.json`);
    return res as AgentCard;
  }

  // ─── Task Operations ─────────────────────────────────────────────

  /** Send a task and wait for completion (non-streaming) */
  async sendTask(params: TaskSendParams): Promise<Task> {
    return this.rpc<Task>('tasks/send', params as unknown as Record<string, unknown>);
  }

  async getTask(params: TaskGetParams): Promise<Task> {
    return this.rpc<Task>('tasks/get', params as unknown as Record<string, unknown>);
  }

  async cancelTask(params: TaskCancelParams): Promise<Task> {
    return this.rpc<Task>('tasks/cancel', params as unknown as Record<string, unknown>);
  }

  // ─── Convenience ─────────────────────────────────────────────────

  /**
   * Send a simple text message to the agent and get a text response.
   * Handles task creation + polling automatically.
   */
  async chat(
    text: string,
    options?: { agentName?: string; sessionId?: string },
  ): Promise<string> {
    const message: A2AMessage = {
      role: 'user',
      parts: [{ type: 'text', text }],
      metadata: options?.agentName ? { agent: options.agentName } : undefined,
    };
    const task = await this.sendTask({
      id: crypto.randomUUID(),
      sessionId: options?.sessionId,
      message,
    });

    if (task.status.state === 'failed') {
      const errPart = task.status.message?.parts.find((p) => p.type === 'text') as
        | { type: 'text'; text: string }
        | undefined;
      throw new Error(`Remote agent failed: ${errPart?.text ?? 'unknown error'}`);
    }

    const textPart = task.status.message?.parts.find((p) => p.type === 'text') as
      | { type: 'text'; text: string }
      | undefined;
    return textPart?.text ?? '';
  }

  /**
   * Stream text from the remote agent via SSE (tasks/sendSubscribe).
   */
  async *chatStream(
    text: string,
    options?: { agentName?: string; sessionId?: string },
  ): AsyncGenerator<string> {
    const message: A2AMessage = {
      role: 'user',
      parts: [{ type: 'text', text }],
      metadata: options?.agentName ? { agent: options.agentName } : undefined,
    };

    const params: TaskSendParams = {
      id: crypto.randomUUID(),
      sessionId: options?.sessionId,
      message,
    };

    const body: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'tasks/sendSubscribe',
      params: params as unknown as Record<string, unknown>,
    };

    const response = await fetch(`${this.baseUrl}/a2a`, {
      method: 'POST',
      headers: { ...this.headers, Accept: 'text/event-stream' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`A2A stream error (${response.status}): ${await response.text()}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as {
              artifact?: { parts: Array<{ type: string; text?: string }> };
              final?: boolean;
            };
            if (event.artifact) {
              for (const part of event.artifact.parts) {
                if (part.type === 'text' && part.text) {
                  yield part.text;
                }
              }
            }
            if (event.final) return;
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ─── Private ────────────────────────────────────────────────────

  private async rpc<T>(method: string, params: Record<string, unknown>): Promise<T> {
    const body: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method,
      params,
    };

    const response = await this.fetch(`${this.baseUrl}/a2a`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const rpcResponse = response as JsonRpcResponse<T>;
    if (rpcResponse.error) {
      throw new Error(`A2A RPC error [${rpcResponse.error.code}]: ${rpcResponse.error.message}`);
    }

    return rpcResponse.result as T;
  }

  private async fetch(url: string, init?: RequestInit): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        headers: { ...this.headers, ...(init?.headers as Record<string, string> | undefined) },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`A2A HTTP error (${response.status}): ${await response.text()}`);
      }

      return response.json();
    } finally {
      clearTimeout(timer);
    }
  }
}
