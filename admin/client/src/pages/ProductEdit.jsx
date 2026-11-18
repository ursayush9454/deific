import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import RichEditor from '../components/RichEditor.jsx';
import useItemForm from '../components/useItemForm.js';
import { Icon, Card, Field, Counter, StatusPill, ImagePicker, FaqEditor, SeoBox, openPreview, timeAgo, useNotice } from '../ui.jsx';

const defaults = () => ({
  name: '', slug: '', category: '', audience: '', summary: '', headline: '', subheadline: '', image: '', image_alt: '',
  features: '', problem: '', who: '', steps: '', details: '', faqs: [], price: '', price_value: '', currency: 'INR',
  cta_label: '', cta_link: 'contact', status: 'draft', show_in_listing: true, sort: 100, seo_title: '', seo_desc: '', noindex: false,
});
const toForm = (it) => ({ ...it, features: (it.features || []).join('\n'), who: (it.who || []).join('\n'), steps: (it.steps || []).join('\n') });

export default function ProductEdit() {
  const F = useItemForm('products', defaults, toForm);
  const { toast } = useNotice();
  const { form, set, meta } = F;
  if (!form) return <Layout title="Product"><p className="muted">Loading…</p></Layout>;
  const host = meta.site_url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const ta = (k, rows, ph) => <textarea name={k} rows={rows} value={form[k]} placeholder={ph} onChange={(e) => set(k, e.target.value)} />;

  return (
    <Layout title={F.isNew ? 'Add product' : 'Edit product'} actions={<>
      {!F.isNew && form.status === 'published' && <a className="btn" href={`/products/${form.slug}`} target="_blank" rel="noopener"><Icon n="external" s={15} /> View live</a>}
      <button className="btn btn-primary" onClick={F.save} disabled={F.saving}><Icon n="check" s={15} /> {F.saving ? 'Saving…' : 'Save'}</button>
      <Link className="btn btn-ghost" to="/products">All products</Link>
    </>}>
      <form className="editor" onSubmit={(e) => { e.preventDefault(); F.save(); }}>
        <div className="editor-main">
          <Card>
            <input className="title-input" name="name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Product name…" required maxLength={120} />
            <div className="slug-row"><span className="muted">{host}/products/</span>
              <input name="slug" value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="auto-from-name" /></div>
          </Card>

          <Card title="Product card" extra={<small className="muted">/products page par dikhne wala card</small>}><div className="stack">
            <div className="grid2">
              <Field label="Category">
                <input name="category" list="pcats" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Healthcare" />
                <datalist id="pcats">{meta.productCategories.map((c) => <option key={c} value={c} />)}</datalist>
              </Field>
              <Field label="For whom (short line)"><input name="audience" value={form.audience} onChange={(e) => set('audience', e.target.value)} placeholder="For clinics, polyclinics and hospitals" /></Field>
            </div>
            <Field label="Short description" count={<Counter value={form.summary} max={160} />}>{ta('summary', 2, 'Patients message on WhatsApp and the agent books the appointment.')}</Field>
            <Field label="Key features" hint="(ek line = ek feature · pehle 3 card par dikhte hain)">{ta('features', 5, 'Books appointments 24/7\nLive doctor and OPD slots\nComplete patient slip')}</Field>
          </div></Card>

          <Card title="Product page" extra={<small className="muted">/products/{form.slug || 'your-product'}</small>}><div className="stack">
            <Field label="Hero headline"><input name="headline" value={form.headline} onChange={(e) => set('headline', e.target.value)} placeholder="It finds the leads and hands you only the hot ones." /></Field>
            <Field label="Hero sub-text">{ta('subheadline', 2, 'Khaali chhodein to short description use hoga')}</Field>
            <Field label="The problem">{ta('problem', 2, 'Your team spends more time searching than selling.')}</Field>
            <div className="grid2">
              <Field label="Who needs it" hint="(ek line = ek chip)">{ta('who', 4, 'Sales teams\nAgencies\nFounders who sell')}</Field>
              <Field label="How it works" hint="(ek line = ek step)">{ta('steps', 4, 'Finds leads for your business\nTalks to each lead\nDelivers the hot leads')}</Field>
            </div>
          </div></Card>

          <div className="card">
            <div className="card-h"><b>Detailed overview</b><small className="muted">Optional · rich text section (images, video)</small></div>
            <RichEditor short resetKey={F.loadKey} value={form.details} placeholder="Optional detailed content…"
              onChange={(html) => { if (html !== null) set('details', html); }} />
          </div>

          <Card title="FAQs" extra={<small className="muted">Optional · accordion + Google FAQ schema</small>}>
            <FaqEditor value={form.faqs} onChange={(v) => set('faqs', v)} />
          </Card>

          <SeoBox form={form} set={set} titleKey="name" descKey="summary" urlPath="products/" siteUrlStr={meta.site_url} siteName={meta.site_name} />
        </div>

        <aside className="editor-side">
          <Card title="Publish" extra={!F.isNew && <StatusPill s={form.status} />}><div className="stack">
            <Field label="Status">
              <select name="status" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (live)</option>
              </select>
            </Field>
            <label className="check"><input type="checkbox" checked={!!form.show_in_listing} onChange={(e) => set('show_in_listing', e.target.checked)} /> /products page par card dikhayein</label>
            <Field label="Display order" hint="(chhota number pehle)"><input type="number" value={form.sort} onChange={(e) => set('sort', e.target.value)} /></Field>
            <div className="row">
              <button type="submit" className="btn btn-primary grow" disabled={F.saving}><Icon n="check" s={15} /> {F.saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn" onClick={() => openPreview({ ...form, type: 'product' }, toast)}><Icon n="eye" s={15} /> Preview</button>
            </div>
            <p className="help">{F.dirty ? 'Unsaved changes · ' : ''}Ctrl/Cmd + S{!F.isNew && form.updated_at ? ` · saved ${timeAgo(form.updated_at)}` : ''}</p>
          </div></Card>

          <Card title="Product image"><div className="stack">
            <ImagePicker value={form.image} onChange={(v) => set('image', v)} help="Landscape image (1200×800) best lagti hai." />
            <Field label="Alt text"><input value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} /></Field>
          </div></Card>

          <Card title="Pricing & button"><div className="stack">
            <Field label="Price label" hint="(optional)"><input name="price" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="Starting at ₹4,999/month" /></Field>
            <div className="grid2">
              <Field label="Price (number)"><input name="price_value" inputMode="decimal" value={form.price_value} onChange={(e) => set('price_value', e.target.value)} placeholder="4999" /></Field>
              <Field label="Currency"><input maxLength={3} value={form.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} /></Field>
            </div>
            <p className="help">Number dalne par Google ko price schema milta hai.</p>
            <Field label="Main button text"><input value={form.cta_label} onChange={(e) => set('cta_label', e.target.value)} placeholder={`Get ${form.name || 'this product'}`} /></Field>
            <Field label="Main button link"><input value={form.cta_link} onChange={(e) => set('cta_link', e.target.value)} placeholder="contact" /><p className="help">Site ka page (contact) ya pura URL. WhatsApp button apne aap lagta hai.</p></Field>
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
