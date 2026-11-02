import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, siteUrl } from './api.js';

/* ---------------- icons ---------------- */
const P = {
  home: <><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
  blog: <><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></>,
  box: <><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /><path d="M12 22V12" /><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" /></>,
  image: <><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></>,
  archive: <><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></>,
  settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  activity: <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />,
  plus: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
  external: <><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
  eye: <><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
  copy: <><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>,
  edit: <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></>,
  menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
};

export function Icon({ n, s = 18 }) {
  return (
    <svg className="ic" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[n]}
    </svg>
  );
}

/* ---------------- notices (alerts + toast) ---------------- */
const NoticeCtx = createContext(null);
export const useNotice = () => useContext(NoticeCtx);

export function NoticeProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [toastMsg, setToast] = useState('');
  const t = useRef();
  const notify = useCallback((msg, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setAlerts((a) => [...a, { id, msg, type }]);
    if (type === 'success') setTimeout(() => setAlerts((a) => a.filter((x) => x.id !== id)), 6000);
  }, []);
  const warnAll = useCallback((list) => (list || []).forEach((w) => notify(w, 'warning')), [notify]);
  const toast = useCallback((m) => {
    setToast(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setToast(''), 2600);
  }, []);
  const clear = useCallback(() => setAlerts([]), []);
  return (
    <NoticeCtx.Provider value={{ alerts, notify, warnAll, toast, clear, dismiss: (id) => setAlerts((a) => a.filter((x) => x.id !== id)) }}>
      {children}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </NoticeCtx.Provider>
  );
}

export function Alerts() {
  const { alerts, dismiss } = useNotice();
  return alerts.map((a) => (
    <div key={a.id} className={`alert alert-${a.type}`}>
      <Icon n={a.type === 'success' ? 'check' : 'x'} s={16} />
      <span>{a.msg}</span>
      <button type="button" className="alert-x" aria-label="Dismiss" onClick={() => dismiss(a.id)}>×</button>
    </div>
  ));
}

/* ---------------- small helpers ---------------- */
export function StatusPill({ s }) {
  const map = { published: ['Live', 'ok'], draft: ['Draft', 'muted'], scheduled: ['Scheduled', 'warn'] };
  const [l, c] = map[s] || [s, 'muted'];
  return <span className={`pill pill-${c}`}>{l}</span>;
}

export function timeAgo(iso) {
  const t = Date.parse(iso);
  if (!t) return iso || '';
  const d = (Date.now() - t) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return Math.floor(d / 60) + ' min ago';
  if (d < 86400) return Math.floor(d / 3600) + ' hr ago';
  if (d < 604800) return Math.floor(d / 86400) + ' days ago';
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const niceDate = (ymd) => {
  const d = new Date(ymd + 'T00:00:00');
  return isNaN(d) ? ymd : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const humanSize = (b) => (b < 1024 ? b + ' B' : b < 1048576 ? Math.round(b / 1024) + ' KB' : (b / 1048576).toFixed(1) + ' MB');

export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export function copyText(txt, toast) {
  (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(
    () => toast('Copied!'),
    () => window.prompt('Copy:', txt)
  );
}

export function Empty({ icon, children }) {
  return <div className="empty"><Icon n={icon} s={34} />{children}</div>;
}

export function Card({ title, extra, children, body = true, className = '' }) {
  return (
    <div className={'card ' + className}>
      {(title || extra) && <div className="card-h">{title && <b>{title}</b>}{extra}</div>}
      {body ? <div className="card-b">{children}</div> : children}
    </div>
  );
}

export function Field({ label, hint, children, count }) {
  return (
    <div className="field">
      {label && <label>{label}{hint && <small className="muted"> {hint}</small>}{count}</label>}
      {children}
    </div>
  );
}

export function Counter({ value, max }) {
  const n = String(value || '').length;
  return <span className={'count' + (n > max ? ' over' : n >= max * 0.6 ? ' good' : '')}>{n}/{max}</span>;
}

/* ---------------- media library modal ---------------- */
export function MediaModal({ onPick, onClose }) {
  const [items, setItems] = useState(null);
  const { toast } = useNotice();
  useEffect(() => {
    api.get('/media').then((d) => setItems(d.items)).catch(() => setItems([]));
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  const up = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    toast('Uploading…');
    try {
      const d = await api.upload([f]);
      onPick(d.files[0]);
    } catch (err) {
      toast(err.message);
    }
  };
  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-head">
          <b>Choose an image</b>
          <label className="btn btn-sm btn-primary"><Icon n="upload" s={15} /> Upload new<input type="file" accept="image/*" hidden onChange={up} /></label>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon n="x" /></button>
        </div>
        <div className="modal-body">
          <div className="media-grid">
            {items === null && <p className="muted">Loading…</p>}
            {items?.length === 0 && <p className="muted">Library khaali hai. Upar "Upload new" se image daalein.</p>}
            {items?.map((m) => (
              <button key={m.path} type="button" className="pick-item" title={m.name} onClick={() => onPick(m)}>
                <img src={m.url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- image picker field ---------------- */
export function ImagePicker({ value, onChange, help }) {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [lib, setLib] = useState(false);
  const fileRef = useRef();
  const { toast } = useNotice();
  const send = async (f) => {
    if (!f) return;
    setBusy(true);
    try {
      const d = await api.upload([f]);
      onChange(d.files[0].path);
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  return (
    <div className={'picker' + (value ? ' has' : '') + (busy ? ' loading' : '')}>
      <div
        className={'picker-prev' + (drag ? ' drag' : '')}
        onClick={() => fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); send(e.dataTransfer.files[0]); }}
      >
        {value && <img src={siteUrl(value)} alt="" />}
        <span className="picker-empty"><Icon n="image" s={28} /><small>Drop image here or click Upload</small></span>
      </div>
      <div className="picker-btns">
        <label className="btn btn-sm"><Icon n="upload" s={15} /> Upload<input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => send(e.target.files[0])} /></label>
        <button type="button" className="btn btn-sm" onClick={() => setLib(true)}>Library</button>
        {value && <button type="button" className="btn btn-sm btn-ghost danger" onClick={() => onChange('')}>Remove</button>}
      </div>
      {help && <p className="help">{help}</p>}
      {lib && <MediaModal onClose={() => setLib(false)} onPick={(m) => { onChange(m.path); setLib(false); }} />}
    </div>
  );
}

/* ---------------- FAQ editor ---------------- */
export function FaqEditor({ value, onChange }) {
  const rows = value?.length ? value : [{ q: '', a: '' }];
  const set = (i, k, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <>
      <div className="faq-list">
        {rows.map((r, i) => (
          <div className="faq-row" key={i}>
            <div className="faq-fields">
              <input type="text" placeholder="Question" value={r.q} onChange={(e) => set(i, 'q', e.target.value)} />
              <textarea rows={2} placeholder="Answer" value={r.a} onChange={(e) => set(i, 'a', e.target.value)} />
            </div>
            <button type="button" className="icon-btn" aria-label="Remove question"
              onClick={() => onChange(rows.length > 1 ? rows.filter((_, j) => j !== i) : [{ q: '', a: '' }])}>
              <Icon n="trash" s={16} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-sm" onClick={() => onChange([...rows, { q: '', a: '' }])}><Icon n="plus" s={15} /> Add question</button>
    </>
  );
}

/* ---------------- SEO box ---------------- */
export function SeoBox({ form, set, titleKey, descKey, urlPath, siteUrlStr, siteName }) {
  const host = String(siteUrlStr || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return (
    <Card title="SEO & Google preview">
      <div className="serp">
        <small>{host}/{urlPath}{form.slug}</small>
        <b>{form.seo_title || `${form[titleKey] || 'Your title'} | ${siteName}`}</b>
        <p>{form.seo_desc || form[descKey] || 'Meta description yahan dikhega. 140-160 characters best hai.'}</p>
      </div>
      <div className="stack">
        <Field label="SEO title" count={<Counter value={form.seo_title} max={60} />}>
          <input type="text" value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} placeholder={`Khaali chhodein to title + | ${siteName} use hoga`} />
        </Field>
        <Field label="Meta description" count={<Counter value={form.seo_desc} max={160} />}>
          <textarea rows={3} value={form.seo_desc} onChange={(e) => set('seo_desc', e.target.value)} placeholder="Khaali chhodein to excerpt/summary use hoga" />
        </Field>
        <label className="check"><input type="checkbox" checked={!!form.noindex} onChange={(e) => set('noindex', e.target.checked)} /> Google se hide karein (noindex)</label>
      </div>
    </Card>
  );
}

/* ---------------- preview: post the form, open result in a new tab ---------------- */
export async function openPreview(payload, toast) {
  const w = window.open('', '_blank');
  try {
    const res = await fetch('/admin/api/preview', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
      body: JSON.stringify(payload),
    });
    const html = await res.text();
    if (!res.ok) throw new Error((() => { try { return JSON.parse(html).error; } catch { return 'Preview failed'; } })());
    if (w) { w.document.open(); w.document.write(html); w.document.close(); }
  } catch (e) {
    if (w) w.close();
    toast(e.message);
  }
}

/* ---------------- unsaved changes guard + Ctrl/Cmd+S ---------------- */
export function useEditorGuards(dirty, save) {
  useEffect(() => {
    const before = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    const key = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
    };
    window.addEventListener('beforeunload', before);
    document.addEventListener('keydown', key);
    return () => { window.removeEventListener('beforeunload', before); document.removeEventListener('keydown', key); };
  }, [dirty, save]);
}
