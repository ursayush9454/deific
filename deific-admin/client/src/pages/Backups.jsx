import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import Layout from '../components/Layout.jsx';
import { Icon, Empty, humanSize, useNotice } from '../ui.jsx';

export default function Backups() {
  const { notify } = useNotice();
  const [items, setItems] = useState(null);
  const load = () => api.get('/backups').then((d) => setItems(d.items));
  useEffect(() => { load(); }, []);
  const restore = async (m) => {
    if (!window.confirm('Is version ko restore karein? Current file ka bhi backup banega.')) return;
    try {
      await api.post('/backups/restore', { file: m.file });
      notify(`${m.path} restore ho gaya.`);
      notify('Note: agla blog/product save karne par listing phir se admin ke data se update hogi.', 'warning');
      load();
    } catch (e) { notify(e.message, 'error'); }
  };
  return (
    <Layout title="Backups">
      <div className="note"><Icon n="archive" s={18} />
        <p>Admin jab bhi website ki koi existing file badalta hai (<b>blog/index.html</b>, <b>products/index.html</b>, <b>sitemap.xml</b>), us se pehle uska backup yahan ban jata hai. <b>Original</b> tag wala backup aapki website ka pehla version hai aur kabhi delete nahi hota.</p>
      </div>
      <div className="card">
        {!items ? <p className="muted pad">Loading…</p> : !items.length ? <Empty icon="archive"><p>Abhi koi backup nahi hai. Pehla blog/product publish hone par banega.</p></Empty> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>File</th><th>When</th><th>Reason</th><th>Size</th><th className="right">Actions</th></tr></thead>
            <tbody>{items.map((m) => (
              <tr key={m.file}>
                <td><b>{m.path}</b> {m.original && <span className="pill pill-red">Original</span>}</td>
                <td><small>{new Date(m.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></td>
                <td><small className="muted">{m.reason}</small></td>
                <td><small>{humanSize(m.size)}</small></td>
                <td className="right actions">
                  <a className="btn btn-sm" href={`/admin/api/backups/download?file=${encodeURIComponent(m.file)}`}>Download</a>
                  <button className="btn btn-sm" onClick={() => restore(m)}><Icon n="refresh" s={14} /> Restore</button>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </Layout>
  );
}
