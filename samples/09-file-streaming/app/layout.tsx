import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'File Streaming | next-js-backend', description: 'StreamFileResponse · @StreamFile · chunked transfer encoding' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg><span>next-js-backend</span></div>
            <div className="sidebar-title">09 · File Streaming</div>
            <div className="sidebar-desc">StreamFileResponse · @StreamFile</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-group-label">Features</div>
            {[{ label: 'StreamFileResponse.from()', desc: 'Stream file from disk with MIME detection' }, { label: 'ReadableStream', desc: 'Chunked transfer encoding' }, { label: 'Custom headers', desc: 'Content-Type · Content-Disposition' }].map(f => (
              <div key={f.label} className="nav-item"><span className="dot" /><div><div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text)' }}>{f.label}</div><div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{f.desc}</div></div></div>
            ))}
            <div className="nav-group-label" style={{ marginTop: '1rem' }}>API Routes</div>
            {['GET /api/files/info', 'GET /api/files/download/:name', 'GET /api/files/stream-text'].map(r => (
              <div key={r} className="nav-item" style={{ fontSize: '.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text3)', padding: '.3rem .75rem' }}>{r}</div>
            ))}
          </nav>
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}><span className="badge badge-blue">Sample 09/13</span></div>
        </aside>
        <main className="main">{children}</main>
      </div>
    </body></html>
  );
}
