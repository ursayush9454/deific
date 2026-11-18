import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, siteUrl } from '../api.js';
import { Icon, StatusPill, niceDate, useNotice, Empty } from '../ui.jsx';
import Layout from '../components/Layout.jsx';

const CFG = {
  blogs: { title: 'Blog posts', one: 'blog post', name: 'title', path: 'blog', newLabel: 'New blog post', tabs: ['published', 'draft', 'scheduled'] },
  products: { title: 'Products', one: 'product', name: 'name', path: 'products', newLabel: 'Add product', tabs: ['published', 'draft'] },
  projects: { title: 'Portfolio projects', one: 'project', name: 'title', path: 'portfolio', newLabel: 'Add project', tabs: ['published', 'draft'] },
};
const ICON = { blogs: 'blog', products: 'box', projects: 'briefcase' };
const COL1 = { blogs: 'Title', products: 'Product', projects: 'Project' };
const TAB_LABEL = { published: 'Live', draft: 'Drafts', scheduled: 'Scheduled' };

export default function ItemList({ kind }) {
  const c = CFG[kind];
  const nav = useNavigate();
  const { notify, warnAll } = useNotice();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('');
  const load = () => api.get('/' + kind).then(setData).catch((e) => notify(e.message, 'error'));
  useEffect(() => { setData(null); setTab(''); setQ(''); load(); }, [kind]);

  const rows = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    return data.items.filter((x) => (!tab || x.status === tab) && (!s || JSON.stringify([x[c.name], x.slug, x.category, x.client]).toLowerCase().includes(s)));
  }, [data, q, tab, c.name]);

  const act = async (fn, okMsg) => {
    try {
      const r = await fn();
      if (okMsg) notify(okMsg);
      warnAll(r?.warnings);
      load();
      return r;
    } catch (e) { notify(e.message, 'error'); }
  };
  const del = (x) => window.confirm(`Delete "${x[c.name]}"? Website se bhi hat jayega.`) && act(() => api.del(`/${kind}/${x.id}`), `${x[c.name]} delete ho gaya.`);
  const dup = async (x) => { const r = await act(() => api.post(`/${kind}/${x.id}/duplicate`), 'Copy ban gayi (draft).'); if (r?.item) nav(`/${kind}/${r.item.id}`); };
  const toggle = (x) => act(() => api.post(`/${kind}/${x.id}/toggle`), x.status === 'published' ? `${x[c.name]} unpublished.` : `${x[c.name]} published.`);

  return (
    <Layout title={c.title} actions={<Link className="btn btn-primary" to={`/${kind}/new`}><Icon n="plus" s={15} /> {c.newLabel}</Link>}>
      <div className="card">
        <div className="toolbar">
          <div className="search"><Icon n="search" s={16} /><input type="search" placeholder={`Search ${kind}…`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="tabs">
            <button type="button" className={tab === '' ? 'on' : ''} onClick={() => setTab('')}>All <span>{data?.items.length ?? ''}</span></button>
            {c.tabs.map((t) => <button key={t} type="button" className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{TAB_LABEL[t]}</button>)}
          </div>
        </div>
        {!data ? <p className="muted pad">Loading…</p> : !data.items.length ? (
          <Empty icon={ICON[kind]}>
            <p><b>Abhi koi {c.one} nahi hai.</b><br />Save karte hi website par live ho jayega aur card lag jayega.</p>
            <Link className="btn btn-primary" to={`/${kind}/new`}>{c.newLabel}</Link>
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{COL1[kind]}</th><th>Category</th><th>Status</th><th>{kind === 'blogs' ? 'Date' : kind === 'projects' ? 'Order' : 'On /products'}</th><th className="right">Actions</th></tr></thead>
              <tbody>
                {rows.map((x) => {
                  const img = kind === 'blogs' ? x.cover : x.image;
                  const anchor = kind === 'projects' ? `#project-${x.slug}` : `/${c.path}/${x.slug}`;
                  return (
                    <tr key={x.id}>
                      <td>
                        <div className="title-cell">
                          <div className="thumb">{img ? <img src={siteUrl(img)} alt="" /> : <span>{kind === 'blogs' ? x.emoji || '📝' : <Icon n={ICON[kind]} />}</span>}</div>
                          <div>
                            <Link to={`/${kind}/${x.id}`}><b>{x[c.name]}</b></Link>
                            {x.featured && <> <span className="pill pill-red">Featured</span></>}
                            <small>{kind === 'projects' ? x.client || '/portfolio' + anchor : anchor}</small>
                          </div>
                        </div>
                      </td>
                      <td>{x.category || '—'}</td>
                      <td><StatusPill s={x.status} /></td>
                      <td>{kind === 'blogs' ? <small>{niceDate(x.date)}</small> : kind === 'projects' ? <small>{x.sort}</small> : x.show_in_listing ? <span className="pill pill-ok">Shown</span> : <span className="pill pill-muted">Hidden</span>}</td>
                      <td className="right actions">
                        <Link className="icon-btn" to={`/${kind}/${x.id}`} title="Edit"><Icon n="edit" s={16} /></Link>
                        {x.status === 'published' && <a className="icon-btn" href={kind === 'projects' ? `/portfolio${anchor}` : anchor} target="_blank" rel="noopener" title="View live"><Icon n="external" s={16} /></a>}
                        <button className="icon-btn" title="Duplicate" onClick={() => dup(x)}><Icon n="copy" s={16} /></button>
                        <button className="btn btn-sm" onClick={() => toggle(x)}>{x.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                        <button className="icon-btn danger" title="Delete" onClick={() => del(x)}><Icon n="trash" s={16} /></button>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && <tr><td colSpan={5} className="muted">Kuch nahi mila.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data?.original?.length > 0 && (
        <div className="card">
          <div className="card-h"><b>Original website {kind}</b><small className="muted">Website ke code me pehle se bane hue. Admin inhe nahi chhoota (safe).</small></div>
          <ul className="list">
            {data.original.map((s) => {
              const href = kind === 'blogs' ? `/blog/${s.slug}` : kind === 'projects' ? '/portfolio' : '/' + String(s.href).replace(/^(\.\.\/)+/, '');
              return (
                <li key={s.slug || s.title}>
                  {kind !== 'blogs' ? <span className="thumb sm">{s.image && <img src={siteUrl(s.image)} alt="" />}</span> : <span className="tag">Original</span>}
                  <span className="grow"><b>{s.title || s.name}</b><small>{s.client ? s.client + ' · ' : ''}{s.category}{s.date ? ' · ' + niceDate(s.date) : ''}{s.audience ? ' · ' + s.audience : ''}</small></span>
                  <a className="icon-btn" href={href} target="_blank" rel="noopener" title="View"><Icon n="external" s={16} /></a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Layout>
  );
}
