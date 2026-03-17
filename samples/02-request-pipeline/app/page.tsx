'use client';
import { useState } from 'react';

type Log = { time: string; endpoint: string; status: number; result: unknown; duration?: string };

export default function PipelinePage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [itemId, setItemId] = useState('7');
  const [role, setRole] = useState('admin');

  const addLog = (endpoint: string, status: number, result: unknown, duration?: string) => {
    setLogs(p => [{ time: new Date().toLocaleTimeString(), endpoint, status, result, duration }, ...p].slice(0, 30));
  };

  const call = async (path: string, label?: string) => {
    const t0 = performance.now();
    const r = await fetch(path);
    const ms = Math.round(performance.now() - t0);
    
    let data;
    try {
      const text = await r.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }
    } catch (e) {
      data = 'Error reading response';
    }

    addLog(label ?? path, r.status, data, `${ms}ms`);
    return { status: r.status, data };
  };

  return (
    <div>
      <div className="page-header">
        <h1>⚙️ Request Pipeline</h1>
        <p>Demonstrating Guards, Interceptors (response wrapping), and custom Pipe transforms.</p>
      </div>

      {/* Guards */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🛡️</div>
          <div>
            <div className="card-title">Guards — RolesGuard (CanActivate)</div>
            <div className="card-desc">Reads <code>?role=</code> query param. Only <code>admin</code> passes the guard.</div>
          </div>
        </div>
        <div className="row" style={{ marginBottom: '.875rem' }}>
          <div className="field">
            <label>Role param</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="admin">admin → 200 ✅</option>
              <option value="user">user → 403 ❌</option>
              <option value="guest">guest → 403 ❌</option>
            </select>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => call(`/api/pipeline/admin?role=${role}`, `/pipeline/admin?role=${role}`)}>
              GET /pipeline/admin
            </button>
          </div>
        </div>
        <div className="chips">
          <span className="chip">@UseGuards(RolesGuard)</span>
          <span className="chip">canActivate(context)</span>
          <span className="chip">403 Forbidden on failure</span>
        </div>
      </div>

      {/* Interceptors */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🔄</div>
          <div>
            <div className="card-title">Interceptors — TimingInterceptor (NestInterceptor)</div>
            <div className="card-desc">Wraps every response in <code>&#x7B; data, meta: &#x7B; duration &#x7D; &#x7D;</code></div>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => call('/api/pipeline/public', '/pipeline/public')}>
          GET /pipeline/public (+ interceptor)
        </button>
        <div className="chips" style={{ marginTop: '.75rem' }}>
          <span className="chip">@UseInterceptors(TimingInterceptor)</span>
          <span className="chip">intercept(context, next)</span>
          <span className="chip">response wrapped in &#x7B; data, meta &#x7D;</span>
        </div>
      </div>

      {/* Pipes */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🔧</div>
          <div>
            <div className="card-title">Pipes — ParseIntPipe (PipeTransform)</div>
            <div className="card-desc">Transforms route <code>:id</code> param to integer. Non-numeric → 400 BadRequest.</div>
          </div>
        </div>
        <div className="row" style={{ marginBottom: '.875rem' }}>
          <div className="field">
            <label>Item ID <span style={{ color: 'var(--text3)' }}>(try "xyz" for 400)</span></label>
            <input className="input" value={itemId} onChange={e => setItemId(e.target.value)} placeholder="e.g. 7 or xyz" />
          </div>
          <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-primary" onClick={() => call(`/api/pipeline/items/${itemId}`, `/pipeline/items/${itemId}`)}>
              GET /items/:id
            </button>
            <button className="btn btn-danger" onClick={() => call('/api/pipeline/bad', '/pipeline/bad (abc)')}>
              GET /bad (xyz)
            </button>
          </div>
        </div>
        <div className="chips">
          <span className="chip">ParseIntPipe.transform(value)</span>
          <span className="chip">BadRequestException on NaN</span>
        </div>
      </div>

      {/* Log */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">📜</div>
          <div>
            <div className="card-title">Request Log</div>
            <div className="card-desc">All API calls above appear here in real-time</div>
          </div>
          {logs.length > 0 && (
            <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '.75rem', padding: '.3rem .7rem' }} onClick={() => setLogs([])}>Clear</button>
          )}
        </div>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: '.85rem', padding: '.5rem 0' }}>No requests yet — click buttons above ↑</div>
        ) : (
          <div className="terminal" style={{ height: 280 }}>
            {logs.map((l, i) => (
              <div key={i} style={{ marginBottom: '.5rem' }}>
                <span style={{ color: 'var(--text3)' }}>{l.time}</span>{' '}
                <span style={{ color: l.status < 400 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>[{l.status}]</span>{' '}
                <span style={{ color: 'var(--accent2)' }}>{l.endpoint}</span>
                {l.duration && <span style={{ color: 'var(--text3)' }}> ({l.duration})</span>}
                <div style={{ color: '#64748b', paddingLeft: '1rem', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(l.result, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
