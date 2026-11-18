import React, { useState } from 'react';
import { api } from '../api.js';
import Layout from '../components/Layout.jsx';
import { Card, Field, useNotice } from '../ui.jsx';
import { useAuth } from '../App.jsx';

export default function Account() {
  const { user, refresh } = useAuth();
  const { notify } = useNotice();
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ current: '', password: '', password2: '' });
  const saveName = async (e) => {
    e.preventDefault();
    try { await api.post('/account', { name }); notify('Profile update ho gaya.'); refresh(); } catch (x) { notify(x.message, 'error'); }
  };
  const savePw = async (e) => {
    e.preventDefault();
    if (pw.password !== pw.password2) return notify('Naye password match nahi kar rahe.', 'error');
    try { await api.post('/account/password', pw); notify('Password change ho gaya.'); setPw({ current: '', password: '', password2: '' }); } catch (x) { notify(x.message, 'error'); }
  };
  return (
    <Layout title="My account">
      <div className="cols even">
        <Card title="Profile"><form className="stack" onSubmit={saveName}>
          <Field label="Username"><input value={user.username} disabled /></Field>
          <Field label="Display name"><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Role"><input value={user.role === 'admin' ? 'Admin' : 'Editor'} disabled /></Field>
          <div><button className="btn btn-primary">Save profile</button></div>
        </form></Card>
        <Card title="Change password"><form className="stack" onSubmit={savePw}>
          <Field label="Current password"><input type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
          <Field label="New password (8+)"><input type="password" required minLength={8} autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></Field>
          <Field label="Confirm new password"><input type="password" required minLength={8} autoComplete="new-password" value={pw.password2} onChange={(e) => setPw({ ...pw, password2: e.target.value })} /></Field>
          <div><button className="btn btn-primary">Update password</button></div>
        </form></Card>
      </div>
    </Layout>
  );
}
