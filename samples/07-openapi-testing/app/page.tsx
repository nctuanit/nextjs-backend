'use client';
import { useState, useEffect } from 'react';

type Product = { id: string; name: string; price: number; category: string; createdAt: string };

export default function OpenApiPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ name: 'Wireless Headphones', price: 79.99, category: 'electronics' });
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [schemaVisible, setSchemaVisible] = useState(false);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/products${category ? `?category=${category}` : ''}`);
    if (r.ok) setProducts(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [category]);

  const create = async () => {
    const r = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json();
    if (r.ok) { notify('Product created!'); load(); }
    else notify(d.message ?? JSON.stringify(d), false);
  };

  const remove = async (id: string) => {
    const r = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (r.ok) { notify('Deleted'); load(); setSelected(null); }
  };

  const CATEGORIES = ['', 'electronics', 'clothing', 'books', 'gadgets', 'furniture'];
  const SCHEMA = `// TypeBox schema — validated at runtime
const ProductSchema = t.Object({
  name:     t.String({ minLength: 2 }),
  price:    t.Number({ minimum: 0 }),
  category: t.String({ minLength: 1 }),
})

// Eden Treaty client (type-safe)
const client = treaty<App>('http://localhost:3007');
const { data } = await client.api.products.get();
//    ^-- fully typed response ✅`;

  return (
    <div>
      <div className="page-header">
        <h1>📖 OpenAPI & Testing</h1>
        <p>Swagger auto-docs from TypeBox schemas + Eden Treaty type-safe client.</p>
        <div style={{ display: 'flex', gap: '.75rem', marginTop: '.75rem' }}>
          <a href="/swagger" target="_blank" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary">Open Swagger UI ↗</button>
          </a>
          <button className="btn btn-ghost" onClick={() => setSchemaVisible(v => !v)}>
            {schemaVisible ? 'Hide' : 'Show'} TypeBox Schema
          </button>
        </div>
      </div>

      {schemaVisible && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon">📄</div>
            <div><div className="card-title">TypeBox Schema + Eden Treaty</div></div>
          </div>
          <div className="code">{SCHEMA}</div>
        </div>
      )}

      {/* Create */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">➕</div>
          <div><div className="card-title">Create Product</div><div className="card-desc">POST /api/products — validated with TypeBox schema</div></div>
        </div>
        <div className="row" style={{ marginBottom: '.75rem' }}>
          <div className="field">
            <label>Name <span style={{ color: 'var(--text3)' }}>(min 2 chars)</span></label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="field" style={{ maxWidth: 120 }}>
            <label>Price</label>
            <input className="input" type="number" min={0} value={form.price} onChange={e => setForm(p => ({ ...p, price: +e.target.value }))} />
          </div>
          <div className="field">
            <label>Category</label>
            <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {['electronics', 'clothing', 'books', 'gadgets', 'furniture', 'other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="btn btn-primary" onClick={create}>Create</button>
          <button className="btn btn-danger" onClick={() => { notify('Validate: name="X" (too short)', false); }}>
            Test Validation (name=X)
          </button>
        </div>
      </div>

      {/* Products grid */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">📦</div>
          <div><div className="card-title">Products</div><div className="card-desc">GET /api/products?category=…</div></div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            {loading && <span className="badge badge-yellow">Loading…</span>}
            <select className="input" style={{ width: 140 }} value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All categories'}</option>)}
            </select>
            <button className="btn btn-ghost" onClick={load} style={{ padding: '.4rem .875rem', fontSize: '.8rem' }}>↻</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.875rem' }}>
          {products.map(p => (
            <div key={p.id}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
              style={{
                background: selected?.id === p.id ? 'rgba(99,102,241,.12)' : 'var(--bg3)',
                border: `1px solid ${selected?.id === p.id ? 'var(--accent)' : 'transparent'}`,
                borderRadius: 10, padding: '1rem', cursor: 'pointer',
                transition: 'border-color .15s, background .15s',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '.875rem', marginBottom: '.25rem' }}>{p.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--green)' }}>${p.price.toFixed(2)}</span>
                <span className="badge badge-blue">{p.category}</span>
              </div>
              {selected?.id === p.id && (
                <div style={{ marginTop: '.75rem', paddingTop: '.625rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)', wordBreak: 'break-all', marginBottom: '.5rem' }}>id: {p.id}</div>
                  <button className="btn btn-danger" style={{ fontSize: '.75rem', padding: '.25rem .625rem', width: '100%', justifyContent: 'center' }}
                    onClick={e => { e.stopPropagation(); remove(p.id); }}>Delete</button>
                </div>
              )}
            </div>
          ))}
          {products.length === 0 && !loading && (
            <div style={{ color: 'var(--text3)', fontSize: '.85rem', gridColumn: '1/-1', padding: '.5rem 0' }}>No products found — create one above</div>
          )}
        </div>
      </div>

      {toast && <div className="toast" style={{ borderColor: toast.ok ? 'var(--green)' : 'var(--red)' }}>{toast.ok ? '✅' : '❌'} {toast.msg}</div>}
    </div>
  );
}
