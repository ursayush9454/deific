import React, { useState } from 'react';
import { api } from '../api.js';
import { Icon, Field } from '../ui.jsx';

export default function Setup({ checks = [], siteUrl, onDone }) {
  const [f, setF] = useState({ name: '', username: '', password: '', password2: '', site_url: siteUrl || '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.password2) return setErr('Dono password match nahi kar rahe.');
    setBusy(true);
    setErr('');
    try {
      await api.post('/setup', f);
      onDone();
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };
  return (
    <div className="auth">
      <div className="auth-card wide">
        <img src="/logo.webp" alt="" width="44" height="44" className="auth-logo" />
        <h1>Admin panel setup</h1>
        <p className="muted">Pehli baar ke liye apna admin account banayein. Yeh sirf ek baar dikhega.</p>
        {err && <div className="alert alert-error"><span>{err}</span></div>}
        <ul className="checks">
          {checks.map(([l, ok]) => <li key={l} className={ok ? 'ok' : 'bad'}><Icon n={ok ? 'check' : 'x'} s={15} /> {l}</li>)}
        </ul>
        <form className="stack" onSubmit={submit}>
          <div className="grid2">
            <Field label="Your name"><input required value={f.name} onChange={set('name')} placeholder="Satvik" /></Field>
            <Field label="Username"><input required pattern="[a-zA-Z0-9_.\-]{3,40}" autoComplete="username" value={f.username} onChange={set('username')} placeholder="admin" /></Field>
          </div>
          <div className="grid2">
            <Field label="Password (8+ characters)"><input type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
            <Field label="Confirm password"><input type="password" required minLength={8} autoComplete="new-password" value={f.password2} onChange={set('password2')} /></Field>
          </div>
          <Field label="Website URL"><input value={f.site_url} onChange={set('site_url')} /><p className="help">Canonical links aur sitemap me use hota hai.</p></Field>
          <button className="btn btn-primary btn-lg" disabled={busy}>Create account &amp; start</button>
        </form>
      </div>
    </div>
  );
}
