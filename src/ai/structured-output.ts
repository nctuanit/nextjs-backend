import { Value } from '@sinclair/typebox/value';
import { type TSchema, type Static } from '@sinclair/typebox';
import type { ChatMessage, LLMProvider, GenerateOptions } from './provider.interface';

// ─── Structured Output ───────────────────────────────────────────

export interface StructuredOutputOptions<T extends TSchema> {
  /** TypeBox schema the response must conform to */
  schema: T;
  /** Max retries on parse/validation failure (default: 2) */
  retries?: number;
  /** Temperature for generation (default: 0 — deterministic) */
  temperature?: number;
  /** Max tokens */
  maxTokens?: number;
}

export class StructuredOutputValidationError extends Error {
  constructor(
    public readonly raw: string,
    public readonly errors: string[],
  ) {
    super(`Structured output validation failed:\n${errors.join('\n')}\n\nRaw response:\n${raw}`);
    this.name = 'StructuredOutputValidationError';
  }
}

/**
 * Generate a structured, type-safe response from an LLM.
 * Uses OpenAI's native JSON mode + TypeBox validation with retry on failure.
 *
 * @example
 * ```ts
 * const result = await generateStructured(provider, 'openai:gpt-4o', messages, {
 *   schema: t.Object({ name: t.String(), price: t.Number() }),
 * });
 * // result is typed as { name: string; price: number }
 * ```
 */
export async function generateStructured<T extends TSchema>(
  provider: LLMProvider,
  model: string,
  messages: ChatMessage[],
  options: StructuredOutputOptions<T>,
): Promise<Static<T>> {
  const maxRetries = options.retries ?? 2;
  const systemJsonInstruction: ChatMessage = {
    role: 'system',
    content:
      'You MUST respond with valid JSON only. No markdown fences, no extra text. ' +
      'The JSON must conform exactly to the following schema:\n' +
      JSON.stringify(options.schema, null, 2),
  };

  // Prepend the JSON instruction before existing system messages
  const augmentedMessages: ChatMessage[] = [systemJsonInstruction, ...messages];

  const generateOptions: GenerateOptions = {
    temperature: options.temperature ?? 0,
    maxTokens: options.maxTokens,
  };

  let lastError: Error | null = null;
  let retryMessages = augmentedMessages;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await provider.generate(model, retryMessages, generateOptions);
    const raw = (response.content ?? '').trim();

    // Strip markdown code fences if model wrapped it anyway
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      lastError = new Error(`JSON parse failed: ${e instanceof Error ? e.message : String(e)}\nRaw: ${raw}`);

      // Reset to original messages + a single correction turn (avoid unbounded growth)
      retryMessages = [
        ...augmentedMessages,
        { role: 'assistant', content: raw },
        {
          role: 'user',
          content: `The response was not valid JSON. Error: ${lastError.message}. Please respond with only valid JSON.`,
        },
      ];
      continue;
    }

    // TypeBox validation
    const errors = Array.from(Value.Errors(options.schema, parsed));
    if (errors.length > 0) {
      const errorMessages = errors.map((e) => `[${e.path}] ${e.message}`);
      lastError = new StructuredOutputValidationError(raw, errorMessages);

      // Reset to original messages + a single correction turn (avoid unbounded growth)
      retryMessages = [
        ...augmentedMessages,
        { role: 'assistant', content: raw },
        {
          role: 'user',
          content: `The JSON does not match the required schema. Errors:\n${errorMessages.join('\n')}\nPlease fix and respond with valid JSON only.`,
        },
      ];
      continue;
    }

    // Coerce/clean the value to match schema defaults
    return Value.Clean(options.schema, Value.Clone(parsed)) as Static<T>;
  }

  throw lastError ?? new Error('Structured output generation failed after retries');
}
