'use client';
import { useState } from 'react';

export default function AuthPage() {
  const [token, setToken] = useState('');
  const [form, setForm] = useState({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
  const [loginForm, setLoginForm] = useState({ email: 'alice@example.com', password: 'password123' });
  const [me, setMe] = useState<Record<string, unknown> | null>(null);
  const [hashes, setHashes] = useState<{ bcrypt: string; argon2: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const register = async () => {
    const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await r.json();
    if (r.ok) notify(`Registered ${data.email}`);
    else notify(data.message ?? JSON.stringify(data), false);
  };

  const login = async () => {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginForm) });
    const data = await r.json();
    if (r.ok && data.access_token) { setToken(data.access_token); notify('Logged in! JWT saved.'); }
    else notify(data.message ?? 'Login failed', false);
  };

  const getMe = async () => {
    const r = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    if (r.ok) { setMe(data); notify('Profile fetched!'); }
    else notify(data.message ?? 'Unauthorized', false);
  };

  const loadHashes = async () => {
    const r = await fetch('/api/auth/hash-demo');
    if (r.ok) { setHashes(await r.json()); notify('Hashes loaded!'); }
  };

  const jwtParts = token ? token.split('.') : [];
  const jwtPayload = jwtParts.length === 3 ? (() => { try { return JSON.parse(atob(jwtParts[1])); } catch { return null; } })() : null;

  const f = (setter: typeof setForm) => (k: string, v: string) => setter((p: typeof form) => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <h1>🔐 Authentication</h1>
        <p>JWT, AuthGuard, PasswordService (bcrypt + argon2id). Full register → login → protected route flow.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Register */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon">📝</div>
            <div><div className="card-title">Register</div><div className="card-desc">POST /api/auth/register</div></div>
          </div>
          {(['name', 'email', 'password'] as const).map(k => (
            <div className="field" key={k}>
              <label><span style={{ textTransform: 'capitalize' }}>{k}</span></label>
              <input className="input" type={k === 'password' ? 'password' : 'text'} value={form[k]} onChange={e => f(setForm as any)(k, e.target.value)} />
            </div>
          ))}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '.5rem', justifyContent: 'center' }} onClick={register}>Register →</button>
        </div>

        {/* Login */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon">🔑</div>
            <div><div className="card-title">Login</div><div className="card-desc">POST /api/auth/login → JWT</div></div>
          </div>
          <div className="field"><label>Email</label><input className="input" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="field"><label>Password</label><input className="input" type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} /></div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '.5rem', justifyContent: 'center' }} onClick={login}>Login → Get JWT</button>
        </div>
      </div>

      {/* JWT display */}
      {token && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon">🎟️</div>
            <div><div className="card-title">JWT Access Token</div><div className="card-desc">Signed with HS256 via JwtService.signAsync()</div></div>
            <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Active</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '.72rem', wordBreak: 'break-all', marginBottom: '.875rem' }}>
            <span style={{ color: '#f87171' }}>{jwtParts[0]}</span>.
            <span style={{ color: '#4ade80' }}>{jwtParts[1]}</span>.
            <span style={{ color: '#60a5fa' }}>{jwtParts[2]}</span>
          </div>
          {jwtPayload && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.625rem', marginBottom: '.875rem' }}>
              {Object.entries(jwtPayload).map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg)', borderRadius: 8, padding: '.5rem .75rem' }}>
                  <div style={{ fontSize: '.68rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div>
                  <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--accent2)', wordBreak: 'break-all' }}>{String(v)}</div>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-success" onClick={getMe}>GET /api/auth/me (protected by AuthGuard)</button>
        </div>
      )}

      {/* /me result */}
      {me && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon">👤</div>
            <div><div className="card-title">Protected Route — /api/auth/me</div><div className="card-desc">@UseGuards(AuthGuard) — requires valid Bearer token</div></div>
          </div>
          <div className="code">{JSON.stringify(me, null, 2)}</div>
        </div>
      )}

      {/* Hash demo */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🔒</div>
          <div><div className="card-title">PasswordService — Hash Algorithms</div><div className="card-desc">bcrypt ($2b$…) vs argon2id ($argon2id$…)</div></div>
          <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={loadHashes}>Run Demo</button>
        </div>
        {hashes && (
          <div>
            <div style={{ marginBottom: '.75rem' }}>
              <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text3)', marginBottom: '.3rem' }}>bcrypt</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '.75rem', color: 'var(--green)', wordBreak: 'break-all' }}>{hashes.bcrypt}</div>
            </div>
            <div>
              <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text3)', marginBottom: '.3rem' }}>argon2id</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '.75rem', color: 'var(--accent2)', wordBreak: 'break-all' }}>{hashes.argon2}</div>
            </div>
          </div>
        )}
        <div className="chips" style={{ marginTop: '.75rem' }}>
          <span className="chip">PasswordService.hash()</span>
          <span className="chip">PasswordService.verify()</span>
          <span className="chip">algorithm: bcrypt | argon2id</span>
        </div>
      </div>

      {toast && <div className="toast" style={{ borderColor: toast.ok ? 'var(--green)' : 'var(--red)' }}>{toast.ok ? '✅' : '❌'} {toast.msg}</div>}
    </div>
  );
}
