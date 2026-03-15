import type {
  LLMProvider,
  ChatMessage,
  GenerateOptions,
  StreamOptions,
  LLMResponse,
  StreamChunk,
  ToolCall,
  ToolDefinition,
} from '../provider.interface';

const ANTHROPIC_DEFAULT_URL = 'https://api.anthropic.com/v1';
const ANTHROPIC_API_VERSION = '2023-06-01';

/**
 * Anthropic LLM Provider — uses fetch, zero SDK dependency.
 * Supports Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku, etc.
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || ANTHROPIC_DEFAULT_URL).replace(/\/$/, '');
  }

  async generate(
    model: string,
    messages: ChatMessage[],
    options?: GenerateOptions,
  ): Promise<LLMResponse> {
    const { systemPrompt, formattedMessages } = this.formatMessages(messages);

    const body: Record<string, unknown> = {
      model,
      messages: formattedMessages,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
    };
    if (options?.topP != null) body.top_p = options.topP;
    if (options?.stop != null) body.stop_sequences = options.stop;

    if (systemPrompt) body.system = systemPrompt;

    if (options?.tools && options.tools.length > 0) {
      body.tools = this.convertTools(options.tools);
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as {
      content: Array<{
        type: 'text' | 'tool_use';
        text?: string;
        id?: string;
        name?: string;
        input?: Record<string, unknown>;
      }>;
      stop_reason: string;
      usage: { input_tokens: number; output_tokens: number };
    };

    // Extract text and tool calls from Anthropic response
    let content = '';
    const toolCalls: ToolCall[] = [];

    for (const block of data.content) {
      if (block.type === 'text' && block.text) {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id || crypto.randomUUID(),
          type: 'function',
          function: {
            name: block.name || '',
            arguments: JSON.stringify(block.input || {}),
          },
        });
      }
    }

    return {
      content: content || null,
      toolCalls,
      finishReason: data.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }

  async *stream(
    model: string,
    messages: ChatMessage[],
    options?: StreamOptions,
  ): AsyncGenerator<StreamChunk> {
    const { systemPrompt, formattedMessages } = this.formatMessages(messages);

    const body: Record<string, unknown> = {
      model,
      messages: formattedMessages,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
      stream: true,
    };
    if (options?.topP != null) body.top_p = options.topP;

    if (systemPrompt) body.system = systemPrompt;

    if (options?.tools && options.tools.length > 0) {
      body.tools = this.convertTools(options.tools);
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      yield { type: 'error', error: `Anthropic API error (${response.status}): ${error}` };
      return;
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
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const event = JSON.parse(trimmed.slice(6)) as {
              type: string;
              delta?: { type: string; text?: string; partial_json?: string };
              content_block?: { type: string; id?: string; name?: string };
            };

            if (event.type === 'content_block_delta') {
              if (event.delta?.type === 'text_delta' && event.delta.text) {
                yield { type: 'text', content: event.delta.text };
              } else if (event.delta?.type === 'input_json_delta' && event.delta.partial_json) {
                yield {
                  type: 'tool_call_delta',
                  toolCall: { function: { name: '', arguments: event.delta.partial_json } },
                };
              }
            } else if (event.type === 'content_block_start') {
              if (event.content_block?.type === 'tool_use') {
                yield {
                  type: 'tool_call_start',
                  toolCall: {
                    id: event.content_block.id,
                    type: 'function',
                    function: { name: event.content_block.name || '', arguments: '' },
                  },
                };
              }
            } else if (event.type === 'message_stop') {
              yield { type: 'done' };
              return;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { type: 'done' };
  }

  /** Convert OpenAI-format tools to Anthropic format */
  private convertTools(
    tools: ToolDefinition[],
  ): Array<{ name: string; description: string; input_schema: Record<string, unknown> }> {
    return tools.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }));
  }

  /** Split system messages from chat messages (Anthropic requires system as top-level param) */
  private formatMessages(messages: ChatMessage[]): {
    systemPrompt: string | undefined;
    formattedMessages: Record<string, unknown>[];
  } {
    let systemPrompt: string | undefined;
    const formattedMessages: Record<string, unknown>[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt = (systemPrompt ? systemPrompt + '\n' : '') + msg.content;
        continue;
      }

      if (msg.role === 'tool') {
        // Anthropic uses 'user' role with tool_result blocks
        formattedMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.tool_call_id,
              content: msg.content,
            },
          ],
        });
      } else if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
        // Assistant message with tool calls
        const content: Record<string, unknown>[] = [];
        if (msg.content) content.push({ type: 'text', text: msg.content });
        for (const tc of msg.tool_calls) {
          let parsedArgs: Record<string, unknown> = {};
          try { parsedArgs = JSON.parse(tc.function.arguments); } catch { /* keep empty */ }
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.function.name,
            input: parsedArgs,
          });
        }
        formattedMessages.push({ role: 'assistant', content });
      } else {
        formattedMessages.push({ role: msg.role, content: msg.content });
      }
    }

    return { systemPrompt, formattedMessages };
  }
}
