import type {
  LLMProvider,
  ChatMessage,
  GenerateOptions,
  StreamOptions,
  LLMResponse,
  StreamChunk,
  ToolCall,
} from '../provider.interface';

const OPENAI_DEFAULT_URL = 'https://api.openai.com/v1';

/**
 * OpenAI LLM Provider — uses fetch, zero SDK dependency.
 * Supports GPT-4o, GPT-4, GPT-3.5-turbo, o1, etc.
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || OPENAI_DEFAULT_URL).replace(/\/$/, '');
  }

  async generate(
    model: string,
    messages: ChatMessage[],
    options?: GenerateOptions,
  ): Promise<LLMResponse> {
    const body: Record<string, unknown> = {
      model,
      messages: this.formatMessages(messages),
      temperature: options?.temperature ?? 0.7,
    };
    if (options?.maxTokens != null) body.max_tokens = options.maxTokens;
    if (options?.topP != null) body.top_p = options.topP;
    if (options?.stop != null) body.stop = options.stop;

    if (options?.tools && options.tools.length > 0) {
      body.tools = options.tools;
      body.tool_choice = 'auto';
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as {
      choices: Array<{
        message: {
          content: string | null;
          tool_calls?: ToolCall[];
        };
        finish_reason: string;
      }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const choice = data.choices[0]!;
    return {
      content: choice.message.content,
      toolCalls: choice.message.tool_calls || [],
      finishReason: choice.finish_reason as LLMResponse['finishReason'],
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async *stream(
    model: string,
    messages: ChatMessage[],
    options?: StreamOptions,
  ): AsyncGenerator<StreamChunk> {
    const body: Record<string, unknown> = {
      model,
      messages: this.formatMessages(messages),
      temperature: options?.temperature ?? 0.7,
      stream: true,
    };
    if (options?.maxTokens != null) body.max_tokens = options.maxTokens;

    if (options?.tools && options.tools.length > 0) {
      body.tools = options.tools;
      body.tool_choice = 'auto';
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      yield { type: 'error', error: `OpenAI API error (${response.status}): ${error}` };
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

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            yield { type: 'done' };
            return;
          }

          try {
            const parsed = JSON.parse(data) as {
              choices: Array<{
                delta: {
                  content?: string;
                  tool_calls?: Array<{
                    index: number;
                    id?: string;
                    type?: string;
                    function?: { name?: string; arguments?: string };
                  }>;
                };
              }>;
            };
            const delta = parsed.choices[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
              yield { type: 'text', content: delta.content };
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.id) {
                  yield {
                    type: 'tool_call_start',
                    toolCall: {
                      id: tc.id,
                      type: 'function',
                      function: { name: tc.function?.name || '', arguments: '' },
                    },
                  };
                } else if (tc.function?.arguments) {
                  yield {
                    type: 'tool_call_delta',
                    toolCall: {
                      function: { name: '', arguments: tc.function.arguments },
                    },
                  };
                }
              }
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { type: 'done' };
  }

  private formatMessages(messages: ChatMessage[]): Record<string, unknown>[] {
    return messages.map((msg) => {
      const formatted: Record<string, unknown> = {
        role: msg.role,
        content: msg.content,
      };
      if (msg.tool_call_id) formatted.tool_call_id = msg.tool_call_id;
      if (msg.tool_calls) formatted.tool_calls = msg.tool_calls;
      return formatted;
    });
  }
}
