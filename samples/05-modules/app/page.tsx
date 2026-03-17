'use client';
import { useState } from 'react';

type CacheResult = { cached: boolean; ttl?: string; serverHitCount?: number; time?: string };
type CompressionResult = { count: number; items: { id: number; value: string }[]; sizeHint: string };
type ThrottleResult = { allowed: boolean; message: string; remainingRequests?: number };

export default function ModulesPage() {
  const [cacheData, setCacheData] = useState<CacheResult | null>(null);
  const [cacheLive, setCacheLive] = useState<CacheResult | null>(null);
  const [hitCount, setHitCount] = useState(0);
  const [compression, setCompression] = useState<CompressionResult | null>(null);
  const [compressMs, setCompressMs] = useState(0);
  const [throttle, setThrottle] = useState<ThrottleResult | null>(null);
  const [throttleHistory, setThrottleHistory] = useState<number[]>([]);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const load = async (key: string, fn: () => Promise<void>) => {
    setLoading(p => ({ ...p, [key]: true }));
    await fn();
    setLoading(p => ({ ...p, [key]: false }));
  };

  const fetchCacheData = () => load('cache', async () => {
    const r = await fetch('/api/cache/data');
    const d = await r.json();
    setCacheData(d);
    setHitCount(d.serverHitCount ?? 0);
  });

  const fetchCacheLive = () => load('live', async () => {
    const r = await fetch('/api/cache/live');
    setCacheLive(await r.json());
  });

  const fetchCompression = () => load('compress', async () => {
    const t0 = performance.now();
    const r = await fetch('/api/compression/payload');
    const ms = Math.round(performance.now() - t0);
    setCompressMs(ms);
    setCompression(await r.json());
  });

  const fetchThrottle = async () => {
    const r = await fetch('/api/throttle/limited');
    const d = await r.json();
    setThrottle(d);
    setThrottleHistory(p => [r.status, ...p].slice(0, 20));
  };

  const fetchHealth = () => load('health', async () => {
    const r = await fetch('/api/health');
    setHealth(await r.json());
  });

  return (
    <div>
      <div className="page-header">
        <h1>🧩 Modules</h1>
        <p>Demonstrating CacheModule, CompressionModule, ThrottleModule, and HealthModule.</p>
      </div>

      {/* Cache */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">⚡</div>
          <div><div className="card-title">CacheModule — CacheInterceptor</div><div className="card-desc">@UseInterceptors(CacheInterceptor) with configurable TTL</div></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: '.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Cached (10s TTL)</div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '.75rem' }} onClick={fetchCacheData} disabled={loading.cache}>
              {loading.cache ? 'Loading…' : 'GET /cache/data'}
            </button>
            {cacheData && (
              <div>
                <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.5rem' }}>
                  <span className={`badge ${cacheData.cached ? 'badge-green' : 'badge-yellow'}`}>{cacheData.cached ? '✓ Cached' : '↻ Fresh'}</span>
                  {cacheData.ttl && <span className="badge badge-blue">TTL: {cacheData.ttl}</span>}
                </div>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '.75rem', fontSize: '.8rem' }}>
                  <div style={{ color: 'var(--text3)', fontSize: '.7rem', marginBottom: '.25rem' }}>Server hit count</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent2)' }}>{hitCount}</div>
                </div>
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: '.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Live (no cache)</div>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: '.75rem' }} onClick={fetchCacheLive} disabled={loading.live}>
              {loading.live ? 'Loading…' : 'GET /cache/live'}
            </button>
            {cacheLive && (
              <div>
                <span className="badge badge-red">Not Cached</span>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '.75rem', marginTop: '.5rem', fontSize: '.8rem' }}>
                  <div style={{ color: 'var(--text3)', fontSize: '.7rem' }}>Fresh time</div>
                  <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--green)' }}>{cacheLive.time}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compression */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🗜️</div>
          <div><div className="card-title">CompressionModule</div><div className="card-desc">Brotli/gzip transport compression — 500-item payload</div></div>
          <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={fetchCompression} disabled={loading.compress}>
            {loading.compress ? 'Loading…' : 'GET /compression/payload'}
          </button>
        </div>
        {compression && (
          <div>
            <div style={{ display: 'flex', gap: '.75rem', marginBottom: '.875rem' }}>
              {[
                { label: 'Items', value: compression.count, color: 'var(--accent2)' },
                { label: 'Transfer time', value: `${compressMs}ms`, color: 'var(--green)' },
                { label: 'Raw size hint', value: compression.sizeHint, color: 'var(--yellow)' },
              ].map(m => (
                <div key={m.label} style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '.5rem .875rem' }}>
                  <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{m.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div className="terminal" style={{ height: 100 }}>
              {compression.items.slice(0, 5).map(i => `item #${i.id}: "${i.value}"`).join('\n')}
              {'\n…and ' + (compression.count - 5) + ' more items'}
            </div>
          </div>
        )}
      </div>

      {/* Throttle */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🚦</div>
          <div><div className="card-title">ThrottleModule — Rate Limiting</div><div className="card-desc">@Throttle(10, 60) — 10 requests per 60s. Click rapidly to hit the limit!</div></div>
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={fetchThrottle}>
            Fire Request
          </button>
        </div>
        {throttle && (
          <div style={{ marginBottom: '.75rem' }}>
            <span className={`badge ${throttle.allowed !== false ? 'badge-green' : 'badge-red'}`}>
              {throttle.allowed !== false ? '✓ Allowed' : '✕ Throttled'}
            </span>
            <span style={{ marginLeft: '.5rem', fontSize: '.8rem', color: 'var(--text2)' }}>{throttle.message}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {throttleHistory.map((status, i) => (
            <div key={i} style={{
              width: 20, height: 20, borderRadius: 4,
              background: status < 400 ? 'var(--green)' : 'var(--red)',
              opacity: (throttleHistory.length - i) / throttleHistory.length,
              transition: 'background .2s',
            }} title={`${status}`} />
          ))}
          {throttleHistory.length === 0 && <span style={{ color: 'var(--text3)', fontSize: '.8rem' }}>No requests yet</span>}
        </div>
      </div>

      {/* Health */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">❤️</div>
          <div><div className="card-title">HealthModule</div><div className="card-desc">GET /api/health — process memory, uptime, environment</div></div>
          <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={fetchHealth} disabled={loading.health}>
            {loading.health ? 'Checking…' : 'Check Health'}
          </button>
        </div>
        {health && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '.625rem' }}>
            {Object.entries(health).map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg)', borderRadius: 8, padding: '.5rem .875rem' }}>
                <div style={{ fontSize: '.68rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div>
                <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text)' }}>{JSON.stringify(v)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
