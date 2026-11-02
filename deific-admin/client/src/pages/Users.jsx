import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import Layout from '../components/Layout.jsx';
import { Icon, Card, Field, timeAgo, useNotice } from '../ui.jsx';
import { useAuth } from '../App.jsx';

export default function Users() {
  const { user } = useAuth();
  const { notify } = useNotice();
  const [items, setItems] = useState([]);
  const blank = { name: '', username: '', password: '', role: 'editor' };
  const [f, setF] = useState(blank);
  const load = () => api.get('/users').then((d) => setItems(d.items));
  useEffect(() => { load(); }, []);
  const add = async (e) => {
    e.preventDefault();
    try { await api.post('/users', f); notify(`User ${f.username} add ho gaya.`); setF(blank); load(); } catch (x) { notify(x.message, 'error'); }
  };
  const del = async (u) => {
    if (!window.confirm(`User ${u} ko delete karein?`)) return;
    try { await api.del('/users/' + encodeURIComponent(u)); notify(`User ${u} delete ho gaya.`); load(); } catch (x) { notify(x.message, 'error'); }
  };
  const reset = async (u) => {
    const p = window.prompt(`Naya password (8+ characters) for ${u}:`);
    if (!p) return;
    try { await api.post(`/users/${encodeURIComponent(u)}/password`, { password: p }); notify(`${u} ka password reset ho gaya.`); } catch (x) { notify(x.message, 'error'); }
  };
  return (
    <Layout title="Users">
      <div className="cols">
        <div className="card">
          <div className="card-h"><b>Team members</b><small className="muted">{items.length} users</small></div>
          <div className="table-wrap"><table className="table">
            <thead><tr><th>User</th><th>Role</th><th>Last login</th><th className="right">Actions</th></tr></thead>
            <tbody>{items.map((u) => (
              <tr key={u.username}>
                <td><div className="title-cell"><span className="avatar">{(u.name || u.username).slice(0, 1).toUpperCase()}</span><div><b>{u.name}</b><small>@{u.username}</small></div></div></td>
                <td><span className={'pill ' + (u.role === 'admin' ? 'pill-red' : 'pill-muted')}>{u.role === 'admin' ? 'Admin' : 'Editor'}</span></td>
                <td><small className="muted">{u.last_login ? timeAgo(u.last_login) : 'Never'}</small></td>
                <td className="right actions">{u.username === user.username ? <small className="muted">You</small> : <>
                  <button className="btn btn-sm" onClick={() => reset(u.username)}>Reset password</button>
                  <button className="icon-btn danger" onClick={() => del(u.username)} title="Delete"><Icon n="trash" s={15} /></button>
                </>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
        <Card title="Add user"><form className="stack" onSubmit={add}>
          <Field label="Name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Username"><input required pattern="[a-zA-Z0-9_.\-]{3,40}" autoComplete="off" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></Field>
          <Field label="Password (8+)"><input type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          <Field label="Role"><select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option value="editor">Editor: sirf blogs, products, media</option>
            <option value="admin">Admin: sab kuch (settings, users, backups)</option>
          </select></Field>
          <div><button className="btn btn-primary"><Icon n="plus" s={15} /> Add user</button></div>
        </form></Card>
      </div>
    </Layout>
  );
}
