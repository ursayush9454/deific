import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import Layout from '../components/Layout.jsx';
import { Icon, Empty, humanSize, copyText, useNotice } from '../ui.jsx';

export default function Media() {
  const { notify, toast } = useNotice();
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const load = () => api.get('/media').then((d) => setItems(d.items));
  useEffect(() => { load(); api.get('/meta').then((m) => setSiteUrl(m.site_url.replace(/\/+$/, ''))); }, []);

  const run = async (files) => {
    files = [...files].filter((f) => /^image\//.test(f.type));
    if (!files.length) return;
    let done = 0;
    const errs = [];
    for (const f of files) {
      setProgress(`Uploading ${f.name}…`);
      try { await api.upload([f]); done++; } catch (e) { errs.push(`${f.name}: ${e.message}`); }
    }
    setProgress('');
    if (done) notify(`${done} image upload ho gayi.`);
    errs.forEach((e) => notify(e, 'error'));
    load();
  };
  const del = async (m) => {
    if (!window.confirm('Is image ko delete karein?')) return;
    try { await api.del('/media?path=' + encodeURIComponent(m.path)); notify('Image delete ho gayi.'); load(); } catch (e) { notify(e.message, 'error'); }
  };
  const shown = (items || []).filter((m) => !q || m.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Layout title="Media Library">
      <div className={'dropzone' + (drag ? ' drag' : '')}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); run(e.dataTransfer.files); }}>
        <Icon n="upload" s={30} />
        <p><b>Images yahan drag &amp; drop karein</b> ya <label className="link">browse karein<input type="file" accept="image/*" multiple hidden onChange={(e) => run(e.target.files)} /></label></p>
        <p className="help">JPG, PNG, WebP, GIF, SVG · max 10 MB · apne aap WebP me compress hoti hain</p>
        {progress && <div className="dz-progress">{progress}</div>}
      </div>
      <div className="card">
        <div className="toolbar">
          <div className="search"><Icon n="search" s={16} /><input type="search" placeholder="Search images…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {items && <small className="muted">{items.length} images · {humanSize(items.reduce((s, m) => s + m.size, 0))}</small>}
        </div>
        {!items ? <p className="muted pad">Loading…</p> : !items.length ? <Empty icon="image"><p>Abhi koi image upload nahi hui.</p></Empty> : (
          <div className="media-grid big">
            {shown.map((m) => (
              <figure className="media-item" key={m.path}>
                <a href={m.url} target="_blank" rel="noopener"><img src={m.url} alt="" loading="lazy" /></a>
                <figcaption>
                  <span className="name" title={m.name}>{m.name}</span>
                  <small className="muted">{humanSize(m.size)} · {new Date(m.mtime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                  <span className="row">
                    <button type="button" className="btn btn-sm" onClick={() => copyText(siteUrl + m.url, toast)}><Icon n="copy" s={14} /> URL</button>
                    <button type="button" className="icon-btn danger" onClick={() => del(m)} title="Delete"><Icon n="trash" s={14} /></button>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
