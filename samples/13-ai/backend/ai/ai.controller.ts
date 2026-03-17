import 'reflect-metadata';
import { Controller, Get, Post, Body } from 'next-js-backend';

// Simple mock AI chat without real provider — demonstrates the API surface
// Replace with AiModule.register({ providers: [{ provider: 'openai', apiKey: '...' }] })

interface Message { role: 'user' | 'assistant'; content: string }

const CONVERSATIONS = new Map<string, Message[]>();

// Simple deterministic "AI" responses for demo
function mockRespond(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi')) return 'Hello! I am a mock AI assistant. How can I help you today?';
  if (lower.includes('weather')) return 'I cannot check the weather, but next-js-backend connects to real LLMs via AiModule!';
  if (lower.includes('next-js-backend')) return 'next-js-backend is a NestJS-inspired framework for Next.js 14+ with DI, Guards, Interceptors, WebSockets, SSE, and AI integration!';
  if (lower.includes('typescript')) return 'TypeScript is wonderful! next-js-backend is fully typed and uses TypeBox for schema validation.';
  if (lower.includes('bye') || lower.includes('goodbye')) return 'Goodbye! Replace me with AiModule + OpenAI to get real AI responses.';
  return `I received: "${input}". Connect a real LLM via AiModule.register({ providers: [{ provider: 'openai', apiKey: process.env.OPENAI_API_KEY }] })`;
}

@Controller('/ai')
export class AiController {
  /** POST /api/ai/chat — single-turn chat */
  @Post('/chat')
  chat(@Body() body: { message: string; sessionId?: string }) {
    const sessionId = body.sessionId ?? 'default';
    const history = CONVERSATIONS.get(sessionId) ?? [];

    const userMsg: Message = { role: 'user', content: body.message };
    const assistantMsg: Message = { role: 'assistant', content: mockRespond(body.message) };

    CONVERSATIONS.set(sessionId, [...history, userMsg, assistantMsg]);

    return {
      response: assistantMsg.content,
      sessionId,
      messageCount: history.length + 2,
    };
  }

  /** GET /api/ai/history?sessionId=... — get conversation history */
  @Get('/history')
  history() {
    const result: Record<string, Message[]> = {};
    CONVERSATIONS.forEach((msgs, id) => { result[id] = msgs; });
    return result;
  }

  /** POST /api/ai/structured — demo structured output */
  @Post('/structured')
  structured(@Body() body: { query: string }) {
    // Simulates AiService.runTyped() structured output
    const topics: Record<string, unknown> = {
      'product': { name: 'Widget Pro', price: 99.99, category: 'electronics', inStock: true },
      'user': { id: 'usr_123', name: 'Alice', role: 'admin', createdAt: '2024-01-15' },
      'weather': { city: 'Hanoi', temp: 28, condition: 'Sunny', humidity: 75 },
    };
    const found = Object.entries(topics).find(([k]) => body.query.toLowerCase().includes(k));
    return {
      schema: 'TypeBox t.Object({ ... })',
      query: body.query,
      result: found ? found[1] : { message: 'Try "product", "user", or "weather" in your query' },
      note: 'Use AiService.runTyped(agentName, query, { schema: t.Object({...}) }) for real structured LLM output',
    };
  }

  /** DELETE /api/ai/history — clear all sessions */
  @Get('/sessions')
  sessions() {
    const sessions = Array.from(CONVERSATIONS.keys()).map(id => ({
      id,
      messageCount: CONVERSATIONS.get(id)!.length,
    }));
    return { sessions, total: sessions.length };
  }
}
