'use client';
import { useState } from 'react';

type Session = { sessionId: string; data: Record<string, string> };

export default function SessionPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [form, setForm] = useState({ userId: 'user_001', name: 'Alice', role: 'admin' });
  const [readId, setReadId] = useState('');
  const [readResult, setReadResult] = useState<Record<string, unknown> | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const create = async () => {
    const r = await fetch('/api/session/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json();
    if (r.ok) {
      setSessions(p => [...p, { sessionId: d.sessionId, data: form }]);
      setReadId(d.sessionId);
      notify(`Session created: ${d.sessionId.slice(0, 8)}…`);
    }
  };

  const read = async (id?: string) => {
    const sid = id ?? readId;
    if (!sid) return;
    const r = await fetch(`/api/session/read?id=${sid}`);
    const d = await r.json();
    setReadResult(d);
    if (d.error) notify(d.error, false); else notify('Session loaded!');
  };

  const destroy = async (sid: string) => {
    await fetch('/api/session/destroy', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid }) });
    setSessions(p => p.filter(s => s.sessionId !== sid));
    if (readId === sid) { setReadId(''); setReadResult(null); }
    notify('Session destroyed');
  };

  return (
    <div>
      <div className="page-header">
        <h1>🗝️ Session Management</h1>
        <p>SessionModule with InMemorySessionStore — create, read, destroy sessions with configurable TTL.</p>
      </div>

      {/* Create */}
      <div className="card">
        <div className="card-header"><div className="card-icon">➕</div><div><div className="card-title">Create Session</div><div className="card-desc">POST /api/session/create → returns sessionId</div></div></div>
        <div className="row" style={{ marginBottom: '.75rem' }}>
          <div className="field"><label>User ID</label><input className="input" value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} /></div>
          <div className="field"><label>Name</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="field"><label>Role</label>
            <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              {['admin', 'user', 'moderator', 'guest'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={create}>Create Session</button>
        <div className="chips" style={{ marginTop: '.75rem' }}>
          <span className="chip">SessionService.createSession(data)</span>
          <span className="chip">InMemorySessionStore</span>
          <span className="chip">TTL: 3600s</span>
        </div>
      </div>

      {/* Active sessions */}
      {sessions.length > 0 && (
        <div className="card">
          <div className="card-header"><div className="card-icon">📋</div><div><div className="card-title">Active Sessions</div><div className="card-desc">Click Read to load data, ✕ to destroy</div></div></div>
          {sessions.map(s => (
            <div key={s.sessionId} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.625rem .875rem', background: 'var(--bg3)', borderRadius: 8, marginBottom: '.5rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '.72rem', color: 'var(--accent2)' }}>{s.sessionId}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: '.15rem' }}>{s.data.name} · {s.data.role}</div>
              </div>
              <button className="btn btn-ghost" style={{ fontSize: '.75rem', padding: '.3rem .625rem' }} onClick={() => { setReadId(s.sessionId); read(s.sessionId); }}>Read</button>
              <button className="btn btn-danger" style={{ fontSize: '.75rem', padding: '.3rem .625rem' }} onClick={() => destroy(s.sessionId)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Read */}
      <div className="card">
        <div className="card-header"><div className="card-icon">🔍</div><div><div className="card-title">Read Session</div><div className="card-desc">GET /api/session/read?id=… — returns stored data</div></div></div>
        <div className="row" style={{ marginBottom: '.75rem' }}>
          <div className="field"><label>Session ID</label><input className="input" value={readId} onChange={e => setReadId(e.target.value)} placeholder="Paste a session ID…" /></div>
          <div style={{ alignSelf: 'flex-end' }}><button className="btn btn-primary" onClick={() => read()}>Read Session</button></div>
        </div>
        {readResult && <div className="code">{JSON.stringify(readResult, null, 2)}</div>}
      </div>

      {toast && <div className="toast" style={{ borderColor: toast.ok ? 'var(--green)' : 'var(--red)' }}>{toast.ok ? '✅' : '❌'} {toast.msg}</div>}
    </div>
  );
}
