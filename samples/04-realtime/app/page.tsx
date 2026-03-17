'use client';
import { useState, useEffect, useRef } from 'react';

type SseEvent = { id: number; time: string; event: string; data: string };
type WsMsg = { dir: 'out' | 'in'; text: string; time: string };

export default function RealtimePage() {
  const [sseEvents, setSseEvents] = useState<SseEvent[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [wsLog, setWsLog] = useState<WsMsg[]>([]);
  const [msgText, setMsgText] = useState('Hello server!');
  const wsRef = useRef<WebSocket | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  let evId = useRef(0);

  const startSse = async () => {
    if (streaming) return;
    setStreaming(true);
    setSseEvents([]);
    abortRef.current = new AbortController();
    try {
      const res = await fetch('/api/sse/stream', { signal: abortRef.current.signal });
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = dec.decode(value);
        const lines = text.split('\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const raw = line.replace('data:', '').trim();
              const parsed = JSON.parse(raw);
              setSseEvents(p => [...p, { id: ++evId.current, time: new Date().toLocaleTimeString(), event: parsed.event ?? 'message', data: JSON.stringify(parsed.data ?? parsed) }]);
            } catch { /* skip */ }
          }
        }
      }
    } catch { /* aborted */ }
    setStreaming(false);
  };

  const stopSse = () => { abortRef.current?.abort(); setStreaming(false); };

  const connectWs = () => {
    if (wsRef.current) return;
    setWsStatus('connecting');
    // Connection upgrades via Next.js Dev rewrites automatically pipe to backend!
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}/api/ws`);
    wsRef.current = ws;
    ws.onopen = () => { setWsStatus('connected'); setWsLog(p => [...p, { dir: 'in', text: '⚡ Connected', time: new Date().toLocaleTimeString() }]); };
    ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data);
        setWsLog(p => [...p, { dir: 'in', text: `[${event}] ${JSON.stringify(data)}`, time: new Date().toLocaleTimeString() }]);
      } catch {
        setWsLog(p => [...p, { dir: 'in', text: e.data, time: new Date().toLocaleTimeString() }]);
      }
    };
    ws.onclose = () => { setWsStatus('disconnected'); wsRef.current = null; setWsLog(p => [...p, { dir: 'in', text: '🔌 Disconnected', time: new Date().toLocaleTimeString() }]); };
  };

  const disconnectWs = () => { wsRef.current?.close(); };

  const sendMsg = () => {
    if (!wsRef.current || wsStatus !== 'connected') return;
    const payload = JSON.stringify({ event: 'message', data: { text: msgText } });
    wsRef.current.send(payload);
    setWsLog(p => [...p, { dir: 'out', text: payload, time: new Date().toLocaleTimeString() }]);
  };

  const sendPing = () => {
    if (!wsRef.current) return;
    const payload = JSON.stringify({ event: 'ping', data: null });
    wsRef.current.send(payload);
    setWsLog(p => [...p, { dir: 'out', text: payload, time: new Date().toLocaleTimeString() }]);
  };

  const emitEvent = async () => {
    const r = await fetch('/api/sse/emit');
    const d = await r.json();
    setSseEvents(p => [...p, { id: ++evId.current, time: new Date().toLocaleTimeString(), event: 'emitted', data: JSON.stringify(d) }]);
  };

  useEffect(() => () => { abortRef.current?.abort(); wsRef.current?.close(); }, []);

  return (
    <div>
      <div className="page-header">
        <h1>⚡ Real-time</h1>
        <p>Server-Sent Events, WebSocket Gateway, and EventEmitter pub/sub system.</p>
      </div>

      {/* SSE */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">📡</div>
          <div>
            <div className="card-title">Server-Sent Events (SSE)</div>
            <div className="card-desc"><code>GET /api/sse/stream</code> — async generator pushes events every second</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <div className="status-bar" style={{ margin: 0 }}>
              <div className={`status-dot ${streaming ? 'green' : 'red'}`} />
              {streaming ? 'Streaming' : 'Idle'}
            </div>
            {!streaming
              ? <button className="btn btn-primary" onClick={startSse}>▶ Start Stream</button>
              : <button className="btn btn-danger" onClick={stopSse}>■ Stop</button>}
            <button className="btn btn-ghost" onClick={emitEvent} style={{ fontSize: '.8rem' }}>Emit Event</button>
          </div>
        </div>
        <div className="terminal" style={{ height: 200 }}>
          {sseEvents.length === 0
            ? <span style={{ color: 'var(--text3)' }}>Click "Start Stream" to begin receiving SSE events…</span>
            : sseEvents.map(e => (
              <div key={e.id}>
                <span style={{ color: 'var(--text3)' }}>{e.time}</span>{' '}
                <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>[{e.event}]</span>{' '}
                <span>{e.data}</span>
              </div>
            ))}
        </div>
        <div className="chips" style={{ marginTop: '.75rem' }}>
          <span className="chip">async function* generator()</span>
          <span className="chip">text/event-stream</span>
          <span className="chip">@OnEvent('app.custom')</span>
        </div>
      </div>

      {/* WebSocket */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🔌</div>
          <div>
            <div className="card-title">WebSocket Gateway</div>
            <div className="card-desc"><code>@WebSocketGateway</code> · <code>@SubscribeMessage('message')</code> · <code>@SubscribeMessage('ping')</code></div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <div className="status-bar" style={{ margin: 0 }}>
              <div className={`status-dot ${wsStatus === 'connected' ? 'green' : wsStatus === 'connecting' ? 'yellow' : 'red'}`} />
              {wsStatus}
            </div>
            {wsStatus === 'disconnected' && <button className="btn btn-success" onClick={connectWs}>Connect WS</button>}
            {wsStatus === 'connected' && <button className="btn btn-danger" onClick={disconnectWs}>Disconnect</button>}
          </div>
        </div>

        {wsStatus === 'connected' && (
          <div className="row" style={{ marginBottom: '.75rem' }}>
            <div className="field">
              <label>Message text</label>
              <input className="input" value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} />
            </div>
            <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '.5rem' }}>
              <button className="btn btn-primary" onClick={sendMsg}>Send msg</button>
              <button className="btn btn-ghost" onClick={sendPing}>Ping</button>
            </div>
          </div>
        )}

        <div className="terminal" style={{ height: 200 }}>
          {wsLog.length === 0
            ? <span style={{ color: 'var(--text3)' }}>Connect to WebSocket to see messages…</span>
            : wsLog.map((m, i) => (
              <div key={i}>
                <span style={{ color: 'var(--text3)' }}>{m.time}</span>{' '}
                <span style={{ color: m.dir === 'out' ? 'var(--yellow)' : 'var(--green)', fontWeight: 600 }}>{m.dir === 'out' ? '→ OUT' : '← IN'}</span>{' '}
                <span>{m.text}</span>
              </div>
            ))}
        </div>
        <div className="chips" style={{ marginTop: '.75rem' }}>
          <span className="chip">@WebSocketGateway()</span>
          <span className="chip">@SubscribeMessage('message')</span>
          <span className="chip">handleConnection / handleDisconnect</span>
        </div>
      </div>
    </div>
  );
}
