'use client';
import { useState, useEffect } from 'react';

type Job = { queued: boolean; jobId: string; queue: string; name: string };
type CronEntry = { tick: number; at: string; message: string };

export default function BackgroundPage() {
  const [sendForm, setSendForm] = useState({ to: 'admin@example.com', subject: 'Welcome', body: 'Hello from next-js-backend!' });
  const [notifyForm, setNotifyForm] = useState({ to: 'user@example.com', message: 'You have a new notification' });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [queueStatus, setQueueStatus] = useState<{ queue: string; pending: number; active: number } | null>(null);
  const [cronLog, setCronLog] = useState<CronEntry[]>([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const loadStatus = async () => {
    const r = await fetch('/api/queue/status');
    if (r.ok) setQueueStatus(await r.json());
  };

  const loadCronLog = async () => {
    const r = await fetch('/api/schedule/log');
    if (r.ok) {
      const d = await r.json() as { entries: CronEntry[] };
      setCronLog(d.entries ?? []);
    }
  };

  useEffect(() => {
    loadStatus();
    loadCronLog();
    const interval = setInterval(() => { loadStatus(); loadCronLog(); }, 3000);
    return () => clearInterval(interval);
  }, []);

  const dispatchSend = async () => {
    const r = await fetch('/api/queue/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sendForm) });
    const d = await r.json();
    if (r.ok) { setJobs(p => [d, ...p]); notify(`Job ${d.jobId} enqueued`); loadStatus(); }
    else notify('Failed to enqueue', false);
  };

  const dispatchNotify = async () => {
    const r = await fetch('/api/queue/email/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(notifyForm) });
    const d = await r.json();
    if (r.ok) { setJobs(p => [d, ...p]); notify(`Notify job ${d.jobId} enqueued`); loadStatus(); }
    else notify('Failed to enqueue', false);
  };

  return (
    <div>
      <div className="page-header">
        <h1>⚙️ Background Tasks</h1>
        <p>QueueModule (@Processor job handlers) and ScheduleModule (@Cron recurring tasks).</p>
      </div>

      {/* Queue status */}
      {queueStatus && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Queue', value: queueStatus.queue, color: 'var(--accent2)' },
            { label: 'Pending', value: queueStatus.pending, color: 'var(--yellow)' },
            { label: 'Active', value: queueStatus.active, color: 'var(--green)' },
          ].map(m => (
            <div key={m.label} className="card" style={{ marginBottom: 0, padding: '1rem' }}>
              <div style={{ fontSize: '.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{m.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: m.color, marginTop: '.25rem' }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Dispatch — Send */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">📧</div>
          <div><div className="card-title">Email Queue — @Processor('email') @Process('send')</div><div className="card-desc">POST /api/queue/email/send → QueueService.add()</div></div>
        </div>
        <div className="row" style={{ marginBottom: '.75rem' }}>
          <div className="field"><label>To</label><input className="input" value={sendForm.to} onChange={e => setSendForm(p => ({ ...p, to: e.target.value }))} /></div>
          <div className="field"><label>Subject</label><input className="input" value={sendForm.subject} onChange={e => setSendForm(p => ({ ...p, subject: e.target.value }))} /></div>
        </div>
        <div className="field" style={{ marginBottom: '.75rem' }}>
          <label>Body</label>
          <input className="input" value={sendForm.body} onChange={e => setSendForm(p => ({ ...p, body: e.target.value }))} />
        </div>
        <button className="btn btn-primary" onClick={dispatchSend}>Dispatch Send Job</button>
      </div>

      {/* Dispatch — Notify */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🔔</div>
          <div><div className="card-title">Email Queue — @Process('notify')</div><div className="card-desc">POST /api/queue/email/notify → simulates push notification</div></div>
        </div>
        <div className="row" style={{ marginBottom: '.75rem' }}>
          <div className="field"><label>To</label><input className="input" value={notifyForm.to} onChange={e => setNotifyForm(p => ({ ...p, to: e.target.value }))} /></div>
          <div className="field"><label>Message</label><input className="input" value={notifyForm.message} onChange={e => setNotifyForm(p => ({ ...p, message: e.target.value }))} /></div>
        </div>
        <button className="btn btn-ghost" onClick={dispatchNotify}>Dispatch Notify Job</button>
      </div>

      {/* Job history */}
      {jobs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon">📋</div>
            <div><div className="card-title">Dispatched Jobs</div><div className="card-desc">Jobs sent in this session</div></div>
            <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '.75rem' }} onClick={() => setJobs([])}>Clear</button>
          </div>
          <table className="table">
            <thead><tr><th>Job ID</th><th>Queue</th><th>Name</th><th>Status</th></tr></thead>
            <tbody>
              {jobs.map((j, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '.75rem' }}>{j.jobId}</td>
                  <td><span className="badge badge-blue">{j.queue}</span></td>
                  <td><span className="badge badge-green">{j.name}</span></td>
                  <td><span className="badge badge-green">✓ Queued</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cron log */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🕒</div>
          <div><div className="card-title">@Cron — Schedule Log</div><div className="card-desc">Auto-refreshes every 3s. @Cron('*/30 * * * * *') fires every 30 seconds.</div></div>
          <div className="status-bar" style={{ marginLeft: 'auto', margin: 0 }}>
            <div className="status-dot green" />
            <span>Live</span>
          </div>
        </div>
        {cronLog.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: '.85rem' }}>Waiting for first cron tick… (fires every 30s)</div>
        ) : (
          <table className="table">
            <thead><tr><th>Tick</th><th>Time</th><th>Message</th></tr></thead>
            <tbody>
              {cronLog.map((e, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: 'var(--accent2)' }}>#{e.tick}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '.75rem' }}>{new Date(e.at).toLocaleTimeString()}</td>
                  <td style={{ fontSize: '.8rem' }}>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="chips" style={{ marginTop: '.75rem' }}>
          <span className="chip">@Cron('*&#x2F;30 * * * * *')</span>
          <span className="chip">ScheduleModule.forRoot()</span>
        </div>
      </div>

      {toast && <div className="toast" style={{ borderColor: toast.ok ? 'var(--green)' : 'var(--red)' }}>{toast.ok ? '✅' : '❌'} {toast.msg}</div>}
    </div>
  );
}
