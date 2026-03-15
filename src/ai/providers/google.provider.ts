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

const GOOGLE_DEFAULT_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Google Gemini LLM Provider — uses fetch, zero SDK dependency.
 * Supports gemini-2.0-flash, gemini-1.5-pro, etc.
 */
export class GoogleProvider implements LLMProvider {
  readonly name = 'google';
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || GOOGLE_DEFAULT_URL).replace(/\/$/, '');
  }

  async generate(
    model: string,
    messages: ChatMessage[],
    options?: GenerateOptions,
  ): Promise<LLMResponse> {
    const { systemInstruction, contents } = this.formatMessages(messages);

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens,
        topP: options?.topP,
        stopSequences: options?.stop,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    if (options?.tools && options.tools.length > 0) {
      body.tools = [{ functionDeclarations: this.convertTools(options.tools) }];
    }

    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google AI API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as {
      candidates: Array<{
        content: {
          parts: Array<{
            text?: string;
            functionCall?: { name: string; args: Record<string, unknown> };
          }>;
        };
        finishReason: string;
      }>;
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
    };

    const candidate = data.candidates[0]!;
    let content = '';
    const toolCalls: ToolCall[] = [];

    for (const part of candidate.content.parts) {
      if (part.text) {
        content += part.text;
      } else if (part.functionCall) {
        toolCalls.push({
          id: crypto.randomUUID(),
          type: 'function',
          function: {
            name: part.functionCall.name,
            arguments: JSON.stringify(part.functionCall.args),
          },
        });
      }
    }

    return {
      content: content || null,
      toolCalls,
      finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
    };
  }

  async *stream(
    model: string,
    messages: ChatMessage[],
    options?: StreamOptions,
  ): AsyncGenerator<StreamChunk> {
    const { systemInstruction, contents } = this.formatMessages(messages);

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    if (options?.tools && options.tools.length > 0) {
      body.tools = [{ functionDeclarations: this.convertTools(options.tools) }];
    }

    const url = `${this.baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      yield { type: 'error', error: `Google AI API error (${response.status}): ${error}` };
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
            const data = JSON.parse(trimmed.slice(6)) as {
              candidates: Array<{
                content: {
                  parts: Array<{
                    text?: string;
                    functionCall?: { name: string; args: Record<string, unknown> };
                  }>;
                };
              }>;
            };

            const parts = data.candidates?.[0]?.content?.parts;
            if (!parts) continue;

            for (const part of parts) {
              if (part.text) {
                yield { type: 'text', content: part.text };
              } else if (part.functionCall) {
                yield {
                  type: 'tool_call_start',
                  toolCall: {
                    id: crypto.randomUUID(),
                    type: 'function',
                    function: {
                      name: part.functionCall.name,
                      arguments: JSON.stringify(part.functionCall.args),
                    },
                  },
                };
              }
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

  /** Convert OpenAI-format tools to Google Gemini format */
  private convertTools(
    tools: ToolDefinition[],
  ): Array<{ name: string; description: string; parameters: Record<string, unknown> }> {
    return tools.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    }));
  }

  /** Convert ChatMessage[] to Gemini contents format */
  private formatMessages(messages: ChatMessage[]): {
    systemInstruction: string | undefined;
    contents: Record<string, unknown>[];
  } {
    let systemInstruction: string | undefined;
    const contents: Record<string, unknown>[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = (systemInstruction ? systemInstruction + '\n' : '') + msg.content;
        continue;
      }

      if (msg.role === 'tool') {
        // Gemini v1beta: tool results are sent as 'user' role with functionResponse
        contents.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: msg.tool_call_id || 'unknown',
                response: { result: msg.content },
              },
            },
          ],
        });
      } else if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
        const parts: Record<string, unknown>[] = [];
        if (msg.content) parts.push({ text: msg.content });
        for (const tc of msg.tool_calls) {
          let parsedArgs: Record<string, unknown> = {};
          try { parsedArgs = JSON.parse(tc.function.arguments); } catch { /* keep empty */ }
          parts.push({
            functionCall: {
              name: tc.function.name,
              args: parsedArgs,
            },
          });
        }
        contents.push({ role: 'model', parts });
      } else {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        contents.push({ role, parts: [{ text: msg.content }] });
      }
    }

    return { systemInstruction, contents };
  }
}
