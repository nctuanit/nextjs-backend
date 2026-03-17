import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Auth | next-js-backend',
  description: 'JWT · AuthGuard · PasswordService · bcrypt · argon2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="sidebar-logo">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>next-js-backend</span>
              </div>
              <div className="sidebar-title">03 · Authentication</div>
              <div className="sidebar-desc">JWT · AuthGuard · PasswordService</div>
            </div>
            <nav className="sidebar-nav">
              <div className="nav-group-label">Features</div>
              {[
                { label: 'JwtModule', desc: 'signAsync · verifyAsync' },
                { label: 'AuthGuard', desc: '@UseGuards + Bearer token' },
                { label: 'PasswordService', desc: 'bcrypt · argon2id · Bun.password' },
              ].map(f => (
                <div key={f.label} className="nav-item">
                  <span className="dot" />
                  <div>
                    <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text)' }}>{f.label}</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
              <div className="nav-group-label" style={{ marginTop: '1rem' }}>API Routes</div>
              {['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me', 'GET /api/auth/hash-demo'].map(r => (
                <div key={r} className="nav-item" style={{ fontSize: '.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text3)', padding: '.3rem .75rem' }}>{r}</div>
              ))}
            </nav>
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
              <span className="badge badge-blue">Sample 03/07</span>
            </div>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
