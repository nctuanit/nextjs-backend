'use client';
import { useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('Tell me about next-js-backend');
  const [sessionId] = useState(() => `session_${Math.random().toString(36).slice(2, 10)}`);
  const [loading, setLoading] = useState(false);
  const [structuredQuery, setStructuredQuery] = useState('Show me a product');
  const [structured, setStructured] = useState<Record<string, unknown> | null>(null);
  const [sessions, setSessions] = useState<{ id: string; messageCount: number }[]>([]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(p => [...p, { role: 'user', content: userMsg }]);
    setLoading(true);
    const r = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg, sessionId }) });
    const d = await r.json();
    setMessages(p => [...p, { role: 'assistant', content: d.response }]);
    setLoading(false);
  };

  const runStructured = async () => {
    const r = await fetch('/api/ai/structured', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: structuredQuery }) });
    setStructured(await r.json());
  };

  const loadSessions = async () => {
    const r = await fetch('/api/ai/sessions');
    const d = await r.json();
    setSessions(d.sessions);
  };

  const PROVIDERS_CODE = `// Connect a real LLM:
AiModule.register({
  providers: [
    { provider: 'openai',    apiKey: process.env.OPENAI_API_KEY },
    { provider: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY },
    { provider: 'google',    apiKey: process.env.GOOGLE_API_KEY },
  ],
  agents: [SupportAgent, CodeAgent],
  tools:  [WeatherTool, SearchTool],
})

// Then inject AiService anywhere:
const reply = await this.ai.run('SupportAgent', userInput, { sessionId });
const typed = await this.ai.runTyped('CodeAgent', query, { schema: CodeSchema });`;

  return (
    <div>
      <div className="page-header">
        <h1>🤖 AI Module</h1>
        <p>AiModule — multi-provider LLM integration with agents, tools, memory, streaming, and structured TypeBox output.</p>
        <div style={{ marginTop: '.75rem', padding: '.75rem 1rem', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 8, fontSize: '.82rem', color: 'var(--yellow)' }}>
          ⚡ Running in <strong>mock mode</strong> — no API key required. Set <code>OPENAI_API_KEY</code> and register AiModule to connect a real LLM.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Chat */}
        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header"><div className="card-icon">💬</div><div><div className="card-title">AiService.run() — Chat</div><div className="card-desc">Session memory via sessionId: <code style={{ fontSize: '.7rem' }}>{sessionId}</code></div></div></div>
          <div style={{ flex: 1, minHeight: 280, maxHeight: 280, overflowY: 'auto', marginBottom: '.75rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {messages.length === 0
              ? <div style={{ color: 'var(--text3)', fontSize: '.85rem', textAlign: 'center', marginTop: '3rem' }}>Start chatting ↓</div>
              : messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', padding: '.625rem .875rem', borderRadius: 12, fontSize: '.85rem',
                    background: m.role === 'user' ? 'var(--accent)' : 'var(--bg3)',
                    color: m.role === 'user' ? '#fff' : 'var(--text)',
                    borderBottomRightRadius: m.role === 'user' ? 2 : 12,
                    borderBottomLeftRadius: m.role === 'assistant' ? 2 : 12,
                  }}>{m.content}</div>
                </div>
              ))}
            {loading && <div style={{ display: 'flex' }}><div style={{ background: 'var(--bg3)', padding: '.5rem .875rem', borderRadius: 12, fontSize: '.75rem', color: 'var(--text3)' }}>Thinking…</div></div>}
          </div>
          <div className="row" style={{ alignItems: 'center' }}>
            <div className="field" style={{ margin: 0, flex: 1 }}>
              <input className="input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message…" />
            </div>
            <button className="btn btn-primary" onClick={send} disabled={loading}>Send</button>
          </div>
        </div>

        <div>
          {/* Structured */}
          <div className="card">
            <div className="card-header"><div className="card-icon">🧩</div><div><div className="card-title">AiService.runTyped()</div><div className="card-desc">Structured TypeBox output</div></div></div>
            <div className="row" style={{ marginBottom: '.75rem' }}>
              <div className="field">
                <label>Query (try: product, user, weather)</label>
                <input className="input" value={structuredQuery} onChange={e => setStructuredQuery(e.target.value)} />
              </div>
              <div style={{ alignSelf: 'flex-end' }}><button className="btn btn-primary" onClick={runStructured}>Run</button></div>
            </div>
            {structured && <div className="code" style={{ fontSize: '.72rem' }}>{JSON.stringify(structured, null, 2)}</div>}
          </div>

          {/* Sessions */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon">📋</div>
              <div><div className="card-title">Active Sessions (Memory)</div><div className="card-desc">InMemoryMemoryStore — conversation history</div></div>
              <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '.75rem' }} onClick={loadSessions}>Refresh</button>
            </div>
            {sessions.length === 0
              ? <div style={{ color: 'var(--text3)', fontSize: '.8rem' }}>Send a chat message first, then refresh</div>
              : sessions.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg3)', borderRadius: 8, padding: '.5rem .875rem', marginBottom: '.375rem', fontSize: '.8rem' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent2)', fontSize: '.72rem' }}>{s.id}</span>
                  <span className="badge badge-green">{s.messageCount} msgs</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-icon">⚡</div><div><div className="card-title">Real Provider Setup</div><div className="card-desc">Replace mock with real OpenAI / Anthropic / Google</div></div></div>
        <div className="code">{PROVIDERS_CODE}</div>
      </div>
    </div>
  );
}
