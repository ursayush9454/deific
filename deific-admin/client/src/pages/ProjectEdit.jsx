import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import RichEditor from '../components/RichEditor.jsx';
import useItemForm from '../components/useItemForm.js';
import { Icon, Card, Field, Counter, StatusPill, ImagePicker, timeAgo } from '../ui.jsx';
import { siteUrl } from '../api.js';

const defaults = () => ({
  title: '', slug: '', client: '', category: '', summary: '', image: '', image_alt: '', color_from: '', color_to: '',
  stats: '', techs: '', subtitle: '', website: '', case_study: '', outcome: '', status: 'draft', sort: 100,
});
// stats: [{value,label}] -> "value | label" lines;  techs: [..] -> lines
const toForm = (it) => ({
  ...it,
  stats: (it.stats || []).map((x) => (x.label ? `${x.value} | ${x.label}` : x.value)).join('\n'),
  techs: (it.techs || []).join('\n'),
});

export default function ProjectEdit() {
  const F = useItemForm('projects', defaults, toForm);
  const { form, set, meta } = F;
  if (!form) return <Layout title="Project"><p className="muted">Loading…</p></Layout>;
  const host = meta.site_url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const ta = (k, rows, ph) => <textarea name={k} rows={rows} value={form[k]} placeholder={ph} onChange={(e) => set(k, e.target.value)} />;
  const gradient = { '--pf': form.color_from || '#0b1f4d', '--pt': form.color_to || '#dc2626' };

  return (
    <Layout title={F.isNew ? 'Add project' : 'Edit project'} actions={<>
      {!F.isNew && form.status === 'published' && <a className="btn" href={`/portfolio#project-${form.slug}`} target="_blank" rel="noopener"><Icon n="external" s={15} /> View live</a>}
      <button className="btn btn-primary" onClick={F.save} disabled={F.saving}><Icon n="check" s={15} /> {F.saving ? 'Saving…' : 'Save'}</button>
      <Link className="btn btn-ghost" to="/projects">All projects</Link>
    </>}>
      <form className="editor" onSubmit={(e) => { e.preventDefault(); F.save(); }}>
        <div className="editor-main">
          <Card>
            <input className="title-input" name="title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Project title…" required maxLength={160} />
            <div className="slug-row"><span className="muted">{host}/portfolio#project-</span>
              <input name="slug" value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="auto-from-title" /></div>
          </Card>

          <Card title="Project card" extra={<small className="muted">/portfolio par dikhne wala card</small>}><div className="stack">
            <div className="grid2">
              <Field label="Client name"><input name="client" value={form.client} onChange={(e) => set('client', e.target.value)} placeholder="Kanpur Nagar Nigam" /></Field>
              <Field label="Tag / category" hint="(image ke upar badge)">
                <input name="category" list="pjcats" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Government · Transport" />
                <datalist id="pjcats">{(meta.projectCategories || []).map((c) => <option key={c} value={c} />)}</datalist>
              </Field>
            </div>
            <Field label="Short description" count={<Counter value={form.summary} max={220} />}>{ta('summary', 3, 'Kya banaya aur kis liye (2-3 line).')}</Field>
            <div className="grid2">
              <Field label="Stats" hint="(ek line = ek box · value | label · max 4)">{ta('stats', 4, '70,000 | E-rickshaws registered\nLive | Fully implemented')}</Field>
              <Field label="Technologies" hint="(ek line = ek tag · max 10)">{ta('techs', 4, 'React\nNode.js\nMongoDB')}</Field>
            </div>
          </div></Card>

          <Card title="Case study" extra={<small className="muted">Optional · "Read case study" button tab hi aayega jab kuch bharoge</small>}><div className="stack">
            <div className="grid2">
              <Field label="Tagline"><input name="subtitle" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="Empowering Retail Through Technology" /></Field>
              <Field label="Project website" hint="(optional)"><input name="website" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://example.com" /></Field>
            </div>
            <Field label="Details" hint="(Challenge, Solution, Features… headings aur lists use kar sakte ho)">
              <RichEditor short resetKey={F.loadKey} value={form.case_study} placeholder="Optional case study content…"
                onChange={(html) => { if (html !== null) set('case_study', html); }} />
            </Field>
            <Field label="Project outcome" hint="(optional · highlighted box)">{ta('outcome', 3, 'Result ya impact ek-do line me.')}</Field>
          </div></Card>
        </div>

        <aside className="editor-side">
          <Card title="Publish" extra={!F.isNew && <StatusPill s={form.status} />}><div className="stack">
            <Field label="Status">
              <select name="status" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (live)</option>
              </select>
            </Field>
            <Field label="Display order" hint="(chhota number pehle)"><input type="number" value={form.sort} onChange={(e) => set('sort', e.target.value)} /></Field>
            <button type="submit" className="btn btn-primary" disabled={F.saving}><Icon n="check" s={15} /> {F.saving ? 'Saving…' : 'Save'}</button>
            <p className="help">{F.dirty ? 'Unsaved changes · ' : ''}Ctrl/Cmd + S{!F.isNew && form.updated_at ? ` · saved ${timeAgo(form.updated_at)}` : ''}</p>
          </div></Card>

          <Card title="Project image"><div className="stack">
            <ImagePicker value={form.image} onChange={(v) => set('image', v)} help="Landscape 3:2 (1200×800) best lagti hai. Image na ho to neeche ke colors ka gradient dikhega." />
            <Field label="Alt text"><input value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} placeholder="Project ka short description" /></Field>
            <Field label="Gradient colors" hint="(optional)">
              <div className="colors">
                <input type="color" value={form.color_from || '#0b1f4d'} onChange={(e) => set('color_from', e.target.value)} aria-label="Gradient start" />
                <input type="color" value={form.color_to || '#dc2626'} onChange={(e) => set('color_to', e.target.value)} aria-label="Gradient end" />
                {(form.color_from || form.color_to) && <button type="button" className="btn btn-sm btn-ghost" onClick={() => { set('color_from', ''); set('color_to', ''); }}>Reset</button>}
              </div>
            </Field>
          </div></Card>

          <Card title="Card preview"><div className="pcard">
            <div className="pcard-media" style={gradient}>
              {form.image && <img src={siteUrl(form.image)} alt="" />}
              {form.category && <span>{form.category}</span>}
            </div>
            <div className="pcard-body">
              {form.client && <small>{form.client}</small>}
              <b>{form.title || 'Project title'}</b>
              <p>{form.summary || 'Short description yahan dikhega.'}</p>
            </div>
          </div></Card>

          {!F.isNew && (
            <div className="card danger-zone"><div className="card-b row">
              <button type="button" className="btn btn-sm" onClick={F.duplicate}><Icon n="copy" s={15} /> Duplicate</button>
              <button type="button" className="btn btn-sm danger" onClick={F.remove}><Icon n="trash" s={15} /> Delete</button>
            </div></div>
          )}
        </aside>
      </form>
    </Layout>
  );
}
