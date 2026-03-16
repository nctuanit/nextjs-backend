# AI Module

AI Module giúp bạn nhúng AI agent vào ứng dụng backend một cách có cấu trúc — không phải kiểu gọi OpenAI trực tiếp rồi xử lý tay, mà là một hệ thống đầy đủ với tool, memory, workflow, và multi-provider.

## Bao Gồm Những Gì?

- 🤖 **AI Agents** — Vòng lặp agent đầy đủ: nhận message → hỏi LLM → gọi tool nếu cần → trả kết quả
- 🔧 **Tool Registry** — Đăng ký tool bằng `@Tool`, input tự động validate với TypeBox
- 🧠 **Memory** — Lưu lịch sử hội thoại (InMemory hoặc Redis)
- 📐 **Structured Output** — LLM trả JSON type-safe, tự retry nếu parse lỗi
- 🔄 **Workflow** — Quy trình nhiều bước với `@Workflow` + `@Step`, chạy song song được
- 🧩 **Plugins** — SearchPlugin (Tavily), DatabasePlugin (SQL có lọc)
- 🌐 **A2A Protocol** — Gọi agent của service khác theo chuẩn Google A2A

## Providers Hỗ Trợ

| Provider | Models | Ghi Chú |
|----------|--------|---------|
| `openai` | `gpt-4o`, `gpt-4-turbo`, `o1` | Hỗ trợ Azure endpoint |
| `anthropic` | `claude-3-5-sonnet`, `claude-3-haiku` | |
| `google` | `gemini-2.0-flash`, `gemini-1.5-pro` | |

> Tất cả dùng `fetch` native — không cần cài SDK của OpenAI hay Anthropic.

## Cài Đặt

```typescript
import { Module, AiModule } from 'next-js-backend';

@Module({
  imports: [
    AiModule.register({
      providers: [
        { provider: 'openai', apiKey: process.env.OPENAI_API_KEY! },
      ],
      tools: [UserTools, ProductTools],
      agents: [SupportAgent],
    }),
  ],
})
export class AppModule {}
```

## Định Nghĩa Agent

```typescript
@Agent({
  name: 'SupportAgent',
  model: 'openai:gpt-4o',
  systemPrompt: 'Bạn là trợ lý hỗ trợ. Dùng tool để tra cứu thông tin, trả lời ngắn gọn.',
  maxIterations: 10,
})
export class SupportAgent {}
```

## Định Nghĩa Tool

```typescript
@Injectable()
export class UserTools {
  @Tool({
    name: 'get_user',
    description: 'Tra cứu thông tin người dùng theo ID',
    schema: t.Object({ id: t.String() }),
  })
  async getUser({ id }: { id: string }) {
    return { id, name: 'Nguyễn Văn A', email: 'a@example.com' };
  }
}
```

::: tip TypeBox validation
Khi có `schema`, input từ LLM được validate và coerce trước. Nếu sai kiểu thì `ToolInputValidationError` — agent sẽ tự biết và thử lại.
:::

## Dùng Trong Service

```typescript
@Injectable()
export class ChatService {
  constructor(private readonly ai: AiService) {}

  // Hỏi một câu
  chat(message: string) {
    return this.ai.run('SupportAgent', message);
  }

  // Hỏi có nhớ lịch sử (theo sessionId)
  chatWithHistory(message: string, sessionId: string) {
    return this.ai.run('SupportAgent', message, { sessionId });
  }

  // Streaming từng chunk
  async *stream(message: string) {
    for await (const chunk of this.ai.stream('SupportAgent', message)) {
      if (chunk.type === 'text') yield chunk.content;
    }
  }
}
```

## Structured Output

Khi cần LLM trả JSON theo đúng schema — không phải text tự do:

```typescript
const result = await this.ai.runTyped('ProductAgent', 'Tìm thông tin iPhone 15', {
  schema: t.Object({
    name: t.String(),
    price: t.Number(),
    inStock: t.Boolean(),
  }),
  temperature: 0,
  retries: 2,
});
// result.price là number, đảm bảo
```
