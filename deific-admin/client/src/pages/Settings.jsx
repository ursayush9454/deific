import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import Layout from '../components/Layout.jsx';
import { Icon, Card, Field, useNotice } from '../ui.jsx';

export default function Settings() {
  const { notify, warnAll } = useNotice();
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/settings').then(setS); }, []);
  if (!s) return <Layout title="Settings"><p className="muted">Loading…</p></Layout>;
  const set = (k) => (e) => setS({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    try { await api.post('/settings', s); notify('Settings save ho gayi. Sab pages update karne ke liye "Rebuild all pages" chalayein.'); } catch (x) { notify(x.message, 'error'); }
  };
  const rebuild = async () => {
    try { const r = await api.post('/rebuild'); notify('Saare blog aur product pages, listings aur sitemap dobara ban gaye.'); warnAll(r.warnings); } catch (x) { notify(x.message, 'error'); }
  };
  const importFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f || !window.confirm('Import se current blogs/products replace ho jayenge. Continue?')) return;
    try {
      const data = JSON.parse(await f.text());
      const r = await api.post('/import', data);
      notify('Import ho gaya aur pages rebuild ho gaye.');
      warnAll(r.warnings);
    } catch (x) { notify(x.message || 'Yeh valid export file nahi hai.', 'error'); }
  };

  return (
    <Layout title="Settings">
      <form className="cols even" onSubmit={save}>
        <Card title="Website"><div className="stack">
          <Field label="Site name"><input value={s.site_name} onChange={set('site_name')} /></Field>
          <Field label="Website URL"><input value={s.site_url} onChange={set('site_url')} /><p className="help">Canonical, Open Graph aur sitemap links isi se bante hain.</p></Field>
          <Field label="WhatsApp number" hint="(country code ke saath)"><input value={s.whatsapp} onChange={set('whatsapp')} placeholder="918750200899" /></Field>
          <Field label="Default blog author"><input value={s.default_author} onChange={set('default_author')} /></Field>
        </div></Card>
        <Card title="Page generation"><div className="stack">
          <Field label="Blog page template"><input value={s.blog_template} onChange={set('blog_template')} /><p className="help">Kisi existing blog post ka path. Iska header, footer, menu aur scripts naye posts me use hote hain.</p></Field>
          <Field label="Product page template"><input value={s.product_template} onChange={set('product_template')} /></Field>
          <label className="check"><input type="checkbox" checked={!!s.update_sitemap} onChange={set('update_sitemap')} /> sitemap.xml apne aap update karein</label>
          <Field label="Backups to keep"><input type="number" min={10} max={500} value={s.max_backups} onChange={set('max_backups')} /></Field>
          <div><button className="btn btn-primary"><Icon n="check" s={15} /> Save settings</button></div>
        </div></Card>
      </form>

      <div className="cols even">
        <Card title="Rebuild website pages"><div className="stack">
          <p className="muted">Website ka header/footer/menu badla ho, ya website files dobara upload ki hon, to sab admin pages naye template se dobara banane ke liye.</p>
          <div><button className="btn" onClick={rebuild}><Icon n="refresh" s={15} /> Rebuild all pages</button></div>
        </div></Card>
        <Card title="Export / Import content"><div className="stack">
          <p className="muted">Saare blogs aur products ka backup ek .json file me.</p>
          <div className="row wrap">
            <a className="btn" href="/admin/api/export"><Icon n="archive" s={15} /> Download content</a>
            <label className="btn"><Icon n="upload" s={15} /> Import .json<input type="file" accept=".json,application/json" hidden onChange={importFile} /></label>
          </div>
        </div></Card>
      </div>

      <Card title="Server"><p className="muted">
        Deific Digital Admin v{s.version} · Website folder: <code>{s.site_dir}</code> · Data: <code>{s.data_dir}</code> · Website served by Node: <b>{s.serve_site ? 'yes' : 'no'}</b>
      </p></Card>
    </Layout>
  );
}
