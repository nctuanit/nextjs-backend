'use client';
import { useState } from 'react';

export default function ConfigPage() {
  const [configAll, setConfigAll] = useState<Record<string, string> | null>(null);
  const [configKeys, setConfigKeys] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const load = async (key: string, fn: () => Promise<void>) => {
    setLoading(p => ({ ...p, [key]: true }));
    await fn();
    setLoading(p => ({ ...p, [key]: false }));
  };

  const SCHEMA_EXAMPLE = `// TypeBox schema for env validation at startup:
ConfigModule.forRoot({
  envFilePath: '.env',
  validationSchema: t.Object({
    APP_NAME:    t.String(),
    APP_PORT:    t.String({ default: '3000' }),
    NODE_ENV:    t.Union([t.Literal('development'), t.Literal('production')]),
    DATABASE_URL: t.Optional(t.String()),
  }),
})

// Inject into any service:
@Injectable()
class MyService {
  constructor(private config: ConfigService) {}
  getDb() { return this.config.get('DATABASE_URL'); }
}`;

  return (
    <div>
      <div className="page-header">
        <h1>⚙️ Config Module</h1>
        <p>ConfigModule.forRoot() loads .env files and exposes a type-safe ConfigService across your entire application.</p>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-icon">📄</div><div><div className="card-title">Schema-validated Config</div><div className="card-desc">TypeBox validates env vars at startup — bad config fails fast</div></div></div>
        <div className="code">{SCHEMA_EXAMPLE}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div className="card-icon">🌐</div>
            <div><div className="card-title">Resolved Config</div><div className="card-desc">GET /api/config/all</div></div>
            <button className="btn btn-primary" style={{ marginLeft: 'auto', fontSize: '.8rem' }} onClick={() => load('all', async () => { const r = await fetch('/api/config/all'); if (r.ok) setConfigAll(await r.json()); })} disabled={loading.all}>
              {loading.all ? '…' : 'Load'}
            </button>
          </div>
          {configAll && (
            <div>
              {Object.entries(configAll).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg3)', borderRadius: 8, padding: '.5rem .875rem', marginBottom: '.375rem', fontSize: '.8rem' }}>
                  <span style={{ color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace' }}>{k}</span>
                  <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div className="card-icon">🔑</div>
            <div><div className="card-title">All Config Keys</div><div className="card-desc">GET /api/config/get — sensitive fields masked</div></div>
            <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '.8rem' }} onClick={() => load('keys', async () => { const r = await fetch('/api/config/get'); if (r.ok) setConfigKeys(await r.json()); })} disabled={loading.keys}>
              {loading.keys ? '…' : 'Load'}
            </button>
          </div>
          {configKeys && (
            <div>
              {Object.entries(configKeys).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg3)', borderRadius: 8, padding: '.5rem .875rem', marginBottom: '.375rem', fontSize: '.8rem' }}>
                  <span style={{ color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace' }}>{k}</span>
                  <span style={{ color: String(v).startsWith('(not set') ? 'var(--text3)' : String(v).includes('***') ? 'var(--green)' : 'var(--text)' }}>{v as string}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <div className="card-header"><div className="card-icon">📁</div><div><div className="card-title">.env File (this project)</div><div className="card-desc">Edit <code>samples/11-config/.env</code> to change values</div></div></div>
        <div className="code">{`APP_NAME=next-js-backend Config Demo
APP_PORT=3011
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgresql://localhost:5432/mydb
REDIS_URL=redis://localhost:6379
# JWT_SECRET=your-secret-here`}</div>
        <div className="chips" style={{ marginTop: '.75rem' }}>
          <span className="chip">ConfigService.get(key, default)</span>
          <span className="chip">ConfigModule.forRoot(&#x7B; envFilePath &#x7D;)</span>
          <span className="chip">TypeBox validation at startup</span>
        </div>
      </div>
    </div>
  );
}
