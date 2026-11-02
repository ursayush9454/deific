import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import Layout from '../components/Layout.jsx';
import { Icon } from '../ui.jsx';

export default function Activity() {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => { api.get('/activity').then((d) => setItems(d.items)); }, []);
  const rows = (items || []).filter((l) => !q || JSON.stringify(l).toLowerCase().includes(q.toLowerCase()));
  return (
    <Layout title="Activity Log">
      <div className="card">
        <div className="toolbar"><div className="search"><Icon n="search" s={16} /><input type="search" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} /></div><small className="muted">Last 300 actions</small></div>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>When</th><th>User</th><th>Action</th><th>Detail</th><th>IP</th></tr></thead>
          <tbody>
            {rows.map((l, i) => (
              <tr key={i}><td><small title={l.at}>{new Date(l.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></td><td><b>{l.user}</b></td><td>{l.action}</td><td className="muted">{l.detail}</td><td><small className="muted">{l.ip}</small></td></tr>
            ))}
            {items && !rows.length && <tr><td colSpan={5} className="muted">No activity yet.</td></tr>}
          </tbody>
        </table></div>
      </div>
    </Layout>
  );
}
