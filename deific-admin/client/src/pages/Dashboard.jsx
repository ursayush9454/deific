import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Icon, StatusPill, timeAgo, humanSize, useNotice } from '../ui.jsx';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../App.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { notify, warnAll } = useNotice();
  const [d, setD] = useState(null);
  const load = () => api.get('/dashboard').then(setD).catch((e) => notify(e.message, 'error'));
  useEffect(() => { load(); }, []);
  const rebuild = async () => {
    try {
      const r = await api.post('/rebuild');
      notify('Saare pages, listings aur sitemap dobara ban gaye.');
      warnAll(r.warnings);
    } catch (e) { notify(e.message, 'error'); }
  };
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return (
    <Layout title="Dashboard" actions={<>
      <Link className="btn" to="/products/new"><Icon n="plus" s={15} /> New product</Link>
      <Link className="btn btn-primary" to="/blogs/new"><Icon n="plus" s={15} /> New blog post</Link>
    </>}>
      <section className="hello">
        <h2>{greet}, {user.name.split(' ')[0]} 👋</h2>
        <p className="muted">Aaj website par kya naya daalna hai? Blog post ya product, dono yahin se live hote hain.</p>
      </section>
      {!d ? <p className="muted">Loading…</p> : <>
        <div className="stats">
          <Link className="stat" to="/blogs"><span className="stat-ic red"><Icon n="blog" /></span><div><b>{d.blogs.live}</b><small>Live blog posts</small></div><em>{d.blogs.drafts} drafts · {d.blogs.scheduled} scheduled</em></Link>
          <Link className="stat" to="/products"><span className="stat-ic navy"><Icon n="box" /></span><div><b>{d.products.live}</b><small>Live products</small></div><em>{d.products.drafts} drafts</em></Link>
          <Link className="stat" to="/media"><span className="stat-ic green"><Icon n="image" /></span><div><b>{d.media.count}</b><small>Uploaded images</small></div><em>{humanSize(d.media.size)} total</em></Link>
          <div className="stat"><span className="stat-ic amber"><Icon n="activity" /></span><div><b>{d.activityCount}</b><small>Actions logged</small></div><em>Last: {d.activity[0] ? timeAgo(d.activity[0].at) : '—'}</em></div>
        </div>
        <div className="cols">
          <div className="card">
            <div className="card-h"><b>Recently edited</b></div>
            {!d.recent.length ? (
              <div className="empty"><Icon n="blog" s={34} />
                <p><b>Abhi tak kuch add nahi hua.</b><br />Pehla blog post ya product banayein. Save karte hi page website par live ho jayega.</p>
                <div className="row"><Link className="btn btn-primary" to="/blogs/new">Write a blog post</Link><Link className="btn" to="/products/new">Add a product</Link></div>
              </div>
            ) : (
              <ul className="list">
                {d.recent.map((r) => (
                  <li key={r.id}>
                    <span className={`tag tag-${r.type}`}>{r.type === 'blog' ? 'Blog' : 'Product'}</span>
                    <Link to={`/${r.type}s/${r.id}`} className="grow"><b>{r.name}</b><small>{timeAgo(r.updated_at)}</small></Link>
                    <StatusPill s={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="stack">
            <div className="card"><div className="card-h"><b>Quick actions</b></div>
              <div className="card-b quick">
                <Link to="/blogs/new"><Icon n="blog" />Write blog</Link>
                <Link to="/products/new"><Icon n="box" />Add product</Link>
                <Link to="/media"><Icon n="upload" />Upload images</Link>
                <a href="/blog" target="_blank" rel="noopener"><Icon n="external" />Open blog</a>
              </div>
            </div>
            <div className="card">
              <div className="card-h"><b>System check</b>{user.role === 'admin' && <button className="btn btn-sm btn-ghost" onClick={rebuild}><Icon n="refresh" s={14} /> Rebuild</button>}</div>
              <ul className="checks pad">{d.health.map(([l, ok]) => <li key={l} className={ok ? 'ok' : 'bad'}><Icon n={ok ? 'check' : 'x'} s={15} /> {l}</li>)}</ul>
            </div>
          </div>
        </div>
        {user.role === 'admin' && d.activity.length > 0 && (
          <div className="card">
            <div className="card-h"><b>Recent activity</b><Link className="btn btn-sm btn-ghost" to="/activity">View all</Link></div>
            <ul className="list compact">
              {d.activity.map((l, i) => (
                <li key={i}><span className="dot" /><span className="grow"><b>{l.user}</b> · {l.action} <span className="muted">{l.detail}</span></span><small className="muted">{timeAgo(l.at)}</small></li>
              ))}
            </ul>
          </div>
        )}
      </>}
    </Layout>
  );
}
