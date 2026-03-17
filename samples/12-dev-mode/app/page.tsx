'use client';
import { useState } from 'react';

type LogEntry = { endpoint: string; status: number; time: string; duration: string };

export default function DevModePage() {
  const [reqLog, setReqLog] = useState<LogEntry[]>([]);
  const [echoBody, setEchoBody] = useState('{ "hello": "world" }');
  const [serverLog, setServerLog] = useState<string[]>([]);

  const call = async (path: string, method = 'GET', body?: string) => {
    const t0 = performance.now();
    const r = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body });
    const ms = Math.round(performance.now() - t0);
    const data = await r.json().catch(() => null);
    setReqLog(p => [{ endpoint: `${method} ${path}`, status: r.status, time: new Date().toLocaleTimeString(), duration: `${ms}ms` }, ...p].slice(0, 20));
    if (path.includes('/log') && data?.entries) { setServerLog(data.entries); }
    return data;
  };

  const sendEcho = async () => {
    try {
      JSON.parse(echoBody); // validate
      await call('/api/demo/echo', 'POST', echoBody);
    } catch { setReqLog(p => [{ endpoint: 'POST /api/demo/echo', status: 400, time: new Date().toLocaleTimeString(), duration: '—' }, ...p]); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>🛠️ Dev Mode</h1>
        <p>DevModeModule enables request logging, route inspection, and structured error output in development.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div>
          {/* Actions */}
          <div className="card">
            <div className="card-header"><div className="card-icon">▶️</div><div><div className="card-title">Trigger Requests</div><div className="card-desc">Each call is logged by DevModeLoggerMiddleware</div></div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <button className="btn btn-primary" onClick={() => call('/api/demo/hello')}>GET /demo/hello</button>
              <button className="btn btn-danger" onClick={() => call('/api/demo/error')}>GET /demo/error (throws)</button>
              <button className="btn btn-ghost" onClick={() => call('/api/demo/log')}>GET /demo/log (fetch server log)</button>
            </div>
          </div>

          {/* Echo */}
          <div className="card">
            <div className="card-header"><div className="card-icon">🔁</div><div><div className="card-title">Echo Endpoint</div><div className="card-desc">POST any JSON body</div></div></div>
            <div className="field"><label>JSON body</label><textarea className="input" rows={3} value={echoBody} onChange={e => setEchoBody(e.target.value)} style={{ resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: '.8rem' }} /></div>
            <button className="btn btn-primary" style={{ marginTop: '.5rem' }} onClick={sendEcho}>POST /demo/echo</button>
          </div>
        </div>

        <div>
          {/* Request log */}
          <div className="card" style={{ height: '100%' }}>
            <div className="card-header">
              <div className="card-icon">📜</div>
              <div><div className="card-title">Browser Request Log</div><div className="card-desc">Client-side timing for all requests</div></div>
              {reqLog.length > 0 && <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '.75rem' }} onClick={() => setReqLog([])}>Clear</button>}
            </div>
            <div className="terminal" style={{ height: 200 }}>
              {reqLog.length === 0
                ? <span style={{ color: 'var(--text3)' }}>Click a button to see requests logged…</span>
                : reqLog.map((l, i) => (
                  <div key={i} style={{ marginBottom: '.375rem' }}>
                    <span style={{ color: 'var(--text3)' }}>{l.time}</span>{' '}
                    <span style={{ color: l.status < 400 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>[{l.status}]</span>{' '}
                    <span style={{ color: 'var(--accent2)' }}>{l.endpoint}</span>{' '}
                    <span style={{ color: 'var(--text3)' }}>{l.duration}</span>
                  </div>
                ))}
            </div>

            {serverLog.length > 0 && (
              <div style={{ marginTop: '.75rem' }}>
                <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text3)', marginBottom: '.25rem', textTransform: 'uppercase' }}>Server log (from /demo/log)</div>
                <div className="terminal" style={{ height: 120 }}>
                  {serverLog.map((l, i) => <div key={i} style={{ color: 'var(--green)' }}>{l}</div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-icon">📋</div><div><div className="card-title">DevModeModule Configuration</div></div></div>
        <div className="code">{`DevModeModule.register({
  enabled: process.env.NODE_ENV !== 'production',
  showRoutes: true,    // logs all registered routes on startup
  logRequests: true,   // DevModeLoggerMiddleware active
})`}</div>
        <div className="chips" style={{ marginTop: '.75rem' }}>
          <span className="chip">DevModeLoggerMiddleware</span>
          <span className="chip">disabled in production</span>
          <span className="chip">DevModeController routes</span>
        </div>
      </div>
    </div>
  );
}
