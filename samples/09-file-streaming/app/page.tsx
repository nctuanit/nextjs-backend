'use client';
import { useState } from 'react';

export default function FileStreamingPage() {
  const [streamLog, setStreamLog] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);

  const loadInfo = async () => {
    const r = await fetch('/api/files/info');
    setInfo(await r.json());
  };

  const streamText = async () => {
    if (streaming) return;
    setStreaming(true);
    setStreamLog([]);
    try {
      const res = await fetch('/api/files/stream-text');
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        setStreamLog(p => [...p, chunk]);
      }
    } catch (e) {
      setStreamLog(p => [...p, `Error: ${e}`]);
    }
    setStreaming(false);
  };

  const download = (name: string) => {
    const a = document.createElement('a');
    a.href = `/api/files/download/${name}`;
    a.download = name;
    a.click();
  };

  const FILES = [
    { name: 'sample.txt', icon: '📄', desc: 'Plain text demo file', mime: 'text/plain' },
    { name: 'data.json', icon: '📊', desc: 'JSON data demo', mime: 'application/json' },
    { name: 'image.svg', icon: '🖼️', desc: 'SVG vector image', mime: 'image/svg+xml' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>📁 File Streaming</h1>
        <p>StreamFileResponse.from(filePath) — stream files with auto MIME detection. Supports chunked transfer encoding.</p>
      </div>

      {/* Info */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">ℹ️</div>
          <div><div className="card-title">Available Files</div><div className="card-desc">GET /api/files/info — list demo files</div></div>
          <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={loadInfo}>Load Info</button>
        </div>
        {info && <div className="code">{JSON.stringify(info, null, 2)}</div>}
      </div>

      {/* Download */}
      <div className="card">
        <div className="card-header"><div className="card-icon">⬇️</div><div><div className="card-title">Download via StreamFileResponse</div><div className="card-desc">GET /api/files/download/:name — streams file with proper Content-Type header</div></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.875rem' }}>
          {FILES.map(f => (
            <div key={f.name} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '1.25rem', textAlign: 'center', cursor: 'pointer', border: '1px solid transparent', transition: 'border-color .15s' }}
              onClick={() => download(f.name)} onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{f.name}</div>
              <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: '.25rem' }}>{f.mime}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text2)', marginTop: '.375rem' }}>{f.desc}</div>
              <div style={{ marginTop: '.75rem' }}><span className="badge badge-blue">Download ↓</span></div>
            </div>
          ))}
        </div>
        <div className="chips" style={{ marginTop: '.875rem' }}>
          <span className="chip">StreamFileResponse.from(path)</span>
          <span className="chip">Auto Content-Type detection</span>
          <span className="chip">Content-Disposition: attachment</span>
        </div>
      </div>

      {/* Inline stream */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🌊</div>
          <div><div className="card-title">Inline Text Stream (ReadableStream)</div><div className="card-desc">GET /api/files/stream-text — chunks arrive 200ms apart</div></div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '.625rem', alignItems: 'center' }}>
            <div className="status-bar" style={{ margin: 0 }}>
              <div className={`status-dot ${streaming ? 'green' : 'red'}`} />
              {streaming ? 'Streaming…' : 'Idle'}
            </div>
            {!streaming
              ? <button className="btn btn-primary" onClick={streamText}>▶ Start</button>
              : <span className="badge badge-yellow">Receiving…</span>}
          </div>
        </div>
        <div className="terminal" style={{ height: 180 }}>
          {streamLog.length === 0
            ? <span style={{ color: 'var(--text3)' }}>Click "Start" to stream text chunks from the server…</span>
            : streamLog.map((chunk, i) => <span key={i} style={{ color: 'var(--green)' }}>{chunk}</span>)}
        </div>
      </div>
    </div>
  );
}
