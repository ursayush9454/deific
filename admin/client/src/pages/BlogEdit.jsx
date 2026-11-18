import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import RichEditor from '../components/RichEditor.jsx';
import useItemForm from '../components/useItemForm.js';
import { Icon, Card, Field, Counter, StatusPill, ImagePicker, FaqEditor, SeoBox, openPreview, timeAgo, useNotice } from '../ui.jsx';

const defaults = (m) => ({
  title: '', slug: '', category: '', tags: '', author: m.default_author, date: m.today, status: 'draft', featured: false,
  cover: '', cover_alt: '', emoji: '📝', excerpt: '', quick_answer: '', content: '', faqs: [], seo_title: '', seo_desc: '', noindex: false,
});
const toForm = (it) => ({ ...it, tags: (it.tags || []).join(', ') });

export default function BlogEdit() {
  const F = useItemForm('blogs', defaults, toForm);
  const { toast } = useNotice();
  const [words, setWords] = useState(0);
  const { form, set, meta } = F;
  if (!form) return <Layout title="Blog post"><p className="muted">Loading…</p></Layout>;
  const host = meta.site_url.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  return (
    <Layout title={F.isNew ? 'New blog post' : 'Edit blog post'} actions={<>
      {!F.isNew && form.status === 'published' && <a className="btn" href={`/blog/${form.slug}`} target="_blank" rel="noopener"><Icon n="external" s={15} /> View live</a>}
      <button className="btn btn-primary" onClick={F.save} disabled={F.saving}><Icon n="check" s={15} /> {F.saving ? 'Saving…' : 'Save'}</button>
      <Link className="btn btn-ghost" to="/blogs">All posts</Link>
    </>}>
      <form className="editor" onSubmit={(e) => { e.preventDefault(); F.save(); }}>
        <div className="editor-main">
          <Card>
            <input className="title-input" name="title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Post title likhein…" required maxLength={200} />
            <div className="slug-row"><span className="muted">{host}/blog/</span>
              <input name="slug" value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="auto-from-title" /></div>
          </Card>

          <div className="card">
            <div className="card-h"><b>Content</b><small className="muted">{words} words · {Math.max(1, Math.ceil(words / 220))} min read</small></div>
            <RichEditor resetKey={F.loadKey} value={form.content} placeholder="Apna article yahan likhein… (paste bhi kar sakte hain)"
              onChange={(html, w) => { setWords(w); if (html !== null) set('content', html); }} />
            <p className="help pad">Tip: Headings (H2/H3) use karein, Google ko structure samajh aata hai. Image button se upload ya library se chunein.</p>
          </div>

          <Card title="Quick answer box" extra={<small className="muted">Optional · article ke top par highlight box (Google aur AI search ke liye accha)</small>}>
            <textarea rows={3} value={form.quick_answer} onChange={(e) => set('quick_answer', e.target.value)} placeholder="2-3 line me article ka seedha jawab…" />
          </Card>

          <Card title="FAQs" extra={<small className="muted">Optional · page par dikhenge + Google FAQ schema</small>}>
            <FaqEditor value={form.faqs} onChange={(v) => set('faqs', v)} />
          </Card>

          <SeoBox form={form} set={set} titleKey="title" descKey="excerpt" urlPath="blog/" siteUrlStr={meta.site_url} siteName={meta.site_name} />
        </div>

        <aside className="editor-side">
          <Card title="Publish" extra={!F.isNew && <StatusPill s={form.status} />}>
            <div className="stack">
              <Field label="Status">
                <select name="status" value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published (live)</option>
                  <option value="scheduled">Scheduled (future date)</option>
                </select>
              </Field>
              <Field label="Publish date">
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
                {form.status === 'scheduled' && <p className="help">Is date ko server apne aap publish kar dega.</p>}
              </Field>
              <label className="check"><input type="checkbox" checked={!!form.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured (blog page par sabse upar)</label>
              <div className="row">
                <button type="submit" className="btn btn-primary grow" disabled={F.saving}><Icon n="check" s={15} /> {F.saving ? 'Saving…' : 'Save'}</button>
                <button type="button" className="btn" onClick={() => openPreview({ ...form, type: 'blog' }, toast)}><Icon n="eye" s={15} /> Preview</button>
              </div>
              <p className="help">{F.dirty ? 'Unsaved changes · ' : ''}Shortcut: Ctrl/Cmd + S{!F.isNew && form.updated_at ? ` · saved ${timeAgo(form.updated_at)}` : ''}</p>
            </div>
          </Card>

          <Card title="Details"><div className="stack">
            <Field label="Category">
              <input name="category" list="catList" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. AI & Automation" />
              <datalist id="catList">{meta.blogCategories.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Tags" hint="(comma se alag)"><input name="tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="ai, automation, whatsapp" /></Field>
            <Field label="Author"><input value={form.author} onChange={(e) => set('author', e.target.value)} /></Field>
            <Field label="Excerpt" count={<Counter value={form.excerpt} max={160} />}>
              <textarea name="excerpt" rows={3} maxLength={300} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} placeholder="Blog listing card par dikhne wali 1-2 line" />
            </Field>
          </div></Card>

          <Card title="Cover image"><div className="stack">
            <ImagePicker value={form.cover} onChange={(v) => set('cover', v)} help="1200×630 best hai. Auto WebP me convert hoti hai." />
            <Field label="Alt text"><input value={form.cover_alt} onChange={(e) => set('cover_alt', e.target.value)} placeholder="Image me kya hai (SEO)" /></Field>
            <Field label="Card emoji" hint="(jab cover image na ho)"><input className="emoji-input" value={form.emoji} maxLength={4} onChange={(e) => set('emoji', e.target.value)} /></Field>
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
