'use client';
import { useState } from 'react';

export default function SerializationPage() {
  const [raw, setRaw] = useState<unknown[]>([]);
  const [safe, setSafe] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const load = async (key: string, fn: () => Promise<void>) => {
    setLoading(p => ({ ...p, [key]: true }));
    await fn();
    setLoading(p => ({ ...p, [key]: false }));
  };

  const loadRaw = () => load('raw', async () => { const r = await fetch('/api/users/raw'); if (r.ok) setRaw(await r.json()); });
  const loadSafe = () => load('safe', async () => { const r = await fetch('/api/users/safe'); if (r.ok) setSafe(await r.json()); });

  const SCHEMA = `class UserResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose()
  @Transform(v => v?.toUpperCase())
  role: string;
  @Expose()
  @Transform(v => new Date(v).toLocaleDateString())
  createdAt: string;

  @Exclude() password: string;     // ← stripped from output
  @Exclude() internalNotes: string; // ← stripped from output
}

// Route handler:
@Get('/safe')
@Serialize(UserResponseDto, { whitelist: true })
findAll() { return this.usersService.findAll(); }`;

  const dangerFields = ['password', 'internalNotes'];

  return (
    <div>
      <div className="page-header">
        <h1>🔀 Serialization</h1>
        <p>@Serialize strips @Exclude() fields and applies @Transform() functions — no more password leaks in API responses.</p>
      </div>

      {/* Schema */}
      <div className="card">
        <div className="card-header"><div className="card-icon">📄</div><div><div className="card-title">UserResponseDto</div><div className="card-desc">@Exclude strips password · @Transform uppercases role · @Expose whitelist</div></div></div>
        <div className="code">{SCHEMA}</div>
      </div>

      {/* Side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div className="card-icon">⚠️</div>
            <div><div className="card-title">Raw Response</div><div className="card-desc">GET /api/users/raw — all fields exposed</div></div>
            <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '.75rem' }} onClick={loadRaw} disabled={loading.raw}>
              {loading.raw ? '…' : 'Load'}
            </button>
          </div>
          {raw.length > 0 ? (
            (raw as Record<string, unknown>[]).map((u, i) => (
              <div key={i} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '.75rem', marginBottom: '.5rem' }}>
                {Object.entries(u).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.2rem' }}>
                    <span style={{ color: dangerFields.includes(k) ? 'var(--red)' : 'var(--text3)' }}>{k}</span>
                    <span style={{ color: dangerFields.includes(k) ? 'var(--red)' : 'var(--text)' }}>{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            ))
          ) : <div style={{ color: 'var(--text3)', fontSize: '.85rem' }}>Click Load to fetch</div>}
          {raw.length > 0 && <div style={{ marginTop: '.5rem' }}><span className="badge badge-red">⚠️ password + internalNotes exposed!</span></div>}
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div className="card-icon">✅</div>
            <div><div className="card-title">Serialized Response</div><div className="card-desc">GET /api/users/safe — @Exclude applied</div></div>
            <button className="btn btn-primary" style={{ marginLeft: 'auto', fontSize: '.75rem' }} onClick={loadSafe} disabled={loading.safe}>
              {loading.safe ? '…' : 'Load'}
            </button>
          </div>
          {safe.length > 0 ? (
            (safe as Record<string, unknown>[]).map((u, i) => (
              <div key={i} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '.75rem', marginBottom: '.5rem' }}>
                {Object.entries(u).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.2rem' }}>
                    <span style={{ color: 'var(--text3)' }}>{k}</span>
                    <span style={{ color: k === 'role' ? 'var(--accent2)' : 'var(--text)' }}>{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            ))
          ) : <div style={{ color: 'var(--text3)', fontSize: '.85rem' }}>Click Load to fetch</div>}
          {safe.length > 0 && (
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
              <span className="badge badge-green">✓ password removed</span>
              <span className="badge badge-green">✓ internalNotes removed</span>
              <span className="badge badge-blue">role uppercased via @Transform</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
