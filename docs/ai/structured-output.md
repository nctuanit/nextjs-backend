# Structured Output

Generate **type-safe, validated JSON** from any LLM provider with automatic retry on parse or schema failure.

## Basic Usage

```typescript
import { generateStructured } from 'next-js-backend/ai';
import { Type as t } from '@sinclair/typebox';

const ProductSchema = t.Object({
  name: t.String(),
  price: t.Number({ minimum: 0 }),
  category: t.String(),
  inStock: t.Boolean(),
  tags: t.Array(t.String()),
});

const product = await generateStructured(provider, 'openai:gpt-4o', [
  { role: 'user', content: 'Extract product info: iPhone 15 Pro, $999, Electronics, in stock, tags: apple, mobile, 5G' }
], {
  schema: ProductSchema,
  retries: 2,
  temperature: 0,
});

// product is: { name: string; price: number; category: string; inStock: boolean; tags: string[] }
Logger.log(product.price); // 999
```

## Via AiService

```typescript
import { Type as t } from '@sinclair/typebox';

const SentimentSchema = t.Object({
  sentiment: t.Union([t.Literal('positive'), t.Literal('negative'), t.Literal('neutral')]),
  score: t.Number({ minimum: -1, maximum: 1 }),
  confidence: t.Number({ minimum: 0, maximum: 1 }),
});

@Injectable()
export class AnalyticsService {
  constructor(private readonly ai: AiService) {}

  async analyzeSentiment(text: string) {
    return this.ai.runTyped('AnalysisAgent', text, {
      schema: SentimentSchema,
      temperature: 0,
    });
  }
}
```

## How It Works

1. Prepends a system message: *"You MUST respond with valid JSON conforming to this schema..."*
2. Generates a response from the LLM
3. Strips any markdown code fences (`` ```json ... ``` ``)
4. Parses JSON — if invalid, sends correction message and retries
5. Validates against TypeBox schema — if invalid, sends field-level errors and retries
6. Coerces/defaults values via `Value.Clean()` and returns typed result
7. If all retries exhausted → throws `StructuredOutputValidationError`

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `schema` | `TSchema` | required | TypeBox schema to validate against |
| `retries` | `number` | `2` | Max retry attempts on failure |
| `temperature` | `number` | `0` | Temperature for LLM (0 = deterministic) |
| `maxTokens` | `number` | — | Max output tokens |

## Error Handling

```typescript
import { StructuredOutputValidationError } from 'next-js-backend/ai';

try {
  const result = await generateStructured(provider, model, messages, { schema });
} catch (e) {
  if (e instanceof StructuredOutputValidationError) {
    console.error('Validation errors:', e.errors);
    console.error('Raw LLM response:', e.raw);
  }
}
```

## Complex Schemas

```typescript
const ReportSchema = t.Object({
  title: t.String(),
  summary: t.String({ description: 'Max 200 words' }),
  sections: t.Array(t.Object({
    heading: t.String(),
    content: t.String(),
    citations: t.Array(t.String({ format: 'uri' })),
  })),
  metadata: t.Object({
    author: t.String(),
    publishedAt: t.String({ format: 'date-time' }),
    wordCount: t.Number(),
  }),
});
```

::: tip
For complex schemas, set `temperature: 0` and `retries: 3` to maximize reliability. Simple schemas typically succeed on the first attempt.
:::
