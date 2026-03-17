'use client';
import { useState, useEffect } from 'react';

type Post = { id: string; title: string; body: string; author: string; createdAt: string; version?: number };

const api = async (path: string, opt?: RequestInit) => {
  const r = await fetch(path, opt);
  return { ok: r.ok, status: r.status, data: await r.json() };
};

export default function CrudPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [v2, setV2] = useState<{ version: number; count: number; items: Post[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: 'My First Post', body: 'Hello from next-js-backend!', author: 'Alice' });
  const [dtoTitle, setDtoTitle] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activePost, setActivePost] = useState<Post | null>(null);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([api('/api/v1/posts'), api('/api/v2/posts')]);
    if (r1.ok) setPosts(r1.data);
    if (r2.ok) setV2(r2.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createTypebox = async () => {
    const { ok, data } = await api('/api/posts/typebox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (ok) { notify('Post created via TypeBox!'); load(); }
    else notify(`Error: ${data?.message ?? JSON.stringify(data)}`, false);
  };

  const createDto = async () => {
    const { ok, data } = await api('/api/posts/dto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, title: dtoTitle }),
    });
    if (ok) { notify('Post created via class-validator DTO!'); load(); setDtoTitle(''); }
    else notify(`Validation: ${JSON.stringify(data?.message ?? data)}`, false);
  };

  const deletePost = async (id: string) => {
    const { ok } = await api(`/api/v1/posts/${id}`, { method: 'DELETE' });
    if (ok) { notify('Post deleted'); load(); }
  };

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <h1>📦 CRUD Basics</h1>
        <p>Demonstrating Controllers, Dependency Injection, TypeBox &amp; class-validator, URI Versioning, and Exception Filters.</p>
      </div>

      {/* Create — TypeBox */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">✍️</div>
          <div>
            <div className="card-title">Create Post — TypeBox Schema</div>
            <div className="card-desc"><code>POST /api/posts/typebox</code> · <code>@Body(t.Object({"{...}"}))</code> validates at runtime</div>
          </div>
        </div>
        <div className="row" style={{ marginBottom: '.75rem' }}>
          <div className="field"><label>Title <span style={{color:'var(--text3)'}}>(min 3 chars)</span></label><input className="input" value={form.title} onChange={e => f('title', e.target.value)} placeholder="Post title" /></div>
          <div className="field"><label>Author</label><input className="input" value={form.author} onChange={e => f('author', e.target.value)} placeholder="Author" /></div>
        </div>
        <div className="field" style={{ marginBottom: '.75rem' }}>
          <label>Body</label>
          <textarea className="input" rows={2} value={form.body} onChange={e => f('body', e.target.value)} style={{ resize: 'vertical' }} />
        </div>
        <button className="btn btn-primary" onClick={createTypebox}>Create with TypeBox</button>
      </div>

      {/* Create — class-validator */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🛡️</div>
          <div>
            <div className="card-title">Create Post — class-validator + ValidationPipe</div>
            <div className="card-desc"><code>POST /api/posts/dto</code> · <code>@IsString() @MinLength(3)</code> on CreatePostDto · Try title &lt; 3 chars for 400</div>
          </div>
        </div>
        <div className="row" style={{ alignItems: 'center' }}>
          <div className="field">
            <label>Title <span style={{ color: 'var(--text3)' }}>(try "ab" → 400)</span></label>
            <input className="input" placeholder='Try "ab" to trigger 400' value={dtoTitle} onChange={e => setDtoTitle(e.target.value)} />
          </div>
          <div style={{ paddingBottom: 0 }}>
            <button className="btn btn-primary" onClick={createDto}>Create with DTO</button>
          </div>
        </div>
      </div>

      {/* Posts list */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">📋</div>
          <div>
            <div className="card-title">Posts — v1 vs v2</div>
            <div className="card-desc">v1 → plain array · v2 → envelope <code>{"{ version, count, items }"}</code></div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
            {loading && <span className="badge badge-yellow">Loading…</span>}
            <button className="btn btn-ghost" onClick={load} style={{ padding: '.4rem .875rem', fontSize: '.8rem' }}>↻ Refresh</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* v1 */}
          <div>
            <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text3)', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              GET /api/v1/posts <span className="badge badge-blue" style={{ marginLeft: '.25rem' }}>v1</span>
            </div>
            {posts.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: '.8rem', padding: '.5rem 0' }}>No posts yet</div>
            ) : posts.map(p => (
              <div key={p.id}
                onClick={() => setActivePost(activePost?.id === p.id ? null : p)}
                style={{
                  background: 'var(--bg3)', borderRadius: 8, padding: '.75rem 1rem', marginBottom: '.5rem',
                  cursor: 'pointer', border: `1px solid ${activePost?.id === p.id ? 'var(--accent)' : 'transparent'}`,
                  transition: 'border-color .15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{p.title}</div>
                  <button className="btn btn-danger" style={{ fontSize: '.72rem', padding: '.2rem .55rem' }}
                    onClick={e => { e.stopPropagation(); deletePost(p.id); }}>✕</button>
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: '.2rem' }}>by {p.author}</div>
                {activePost?.id === p.id && (
                  <div style={{ marginTop: '.625rem', fontSize: '.8rem', color: 'var(--text2)', borderTop: '1px solid var(--border)', paddingTop: '.5rem' }}>
                    {p.body}<br />
                    <span style={{ color: 'var(--text3)' }}>id: {p.id}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* v2 */}
          <div>
            <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text3)', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              GET /api/v2/posts <span className="badge badge-green" style={{ marginLeft: '.25rem' }}>v2</span>
            </div>
            {v2 && (
              <>
                <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.625rem' }}>
                  <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '.5rem .875rem', fontSize: '.8rem', flex: 1 }}>
                    <div style={{ color: 'var(--text3)', fontSize: '.7rem' }}>version</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent2)' }}>{v2.version}</div>
                  </div>
                  <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '.5rem .875rem', fontSize: '.8rem', flex: 1 }}>
                    <div style={{ color: 'var(--text3)', fontSize: '.7rem' }}>count</div>
                    <div style={{ fontWeight: 700, color: 'var(--green)' }}>{v2.count}</div>
                  </div>
                </div>
                <div className="code" style={{ maxHeight: 220 }}>{JSON.stringify(v2, null, 2)}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast" style={{ borderColor: toast.ok ? 'var(--green)' : 'var(--red)' }}>
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}
