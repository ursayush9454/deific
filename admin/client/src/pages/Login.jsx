import React, { useState } from 'react';
import { api } from '../api.js';
import { Icon, Field } from '../ui.jsx';

export default function Login({ onDone }) {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [f, setF] = useState({ username: '', password: '' });
  const [r, setR] = useState({ username: '', key: '', password: '', password2: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api.post('/login', f);
      onDone();
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    if (r.password !== r.password2) return setErr('Dono password match nahi kar rahe.');
    setBusy(true);
    setErr('');
    try {
      await api.post('/forgot-password', { username: r.username, key: r.key, password: r.password });
      setF({ username: r.username, password: '' });
      setR({ username: '', key: '', password: '', password2: '' });
      setOk('Password reset ho gaya. Ab naye password se login karein.');
      setMode('login');
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  };

  const go = (m) => { setMode(m); setErr(''); setOk(''); };

  if (mode === 'forgot') {
    return (
      <div className="auth">
        <div className="auth-card">
          <img src="/logo.webp" alt="" width="44" height="44" className="auth-logo" />
          <h1>Forgot password</h1>
          <p className="muted">Server ki <b>.env</b> file me <b>RECOVERY_KEY</b> hoti hai. Wahi key daal kar naya password set karein.</p>
          {err && <div className="alert alert-error"><span>{err}</span></div>}
          <form className="stack" onSubmit={reset}>
            <Field label="Username"><input required autoFocus autoComplete="username" value={r.username} onChange={(e) => setR({ ...r, username: e.target.value })} /></Field>
            <Field label="Recovery key"><input required autoComplete="off" value={r.key} onChange={(e) => setR({ ...r, key: e.target.value })} /></Field>
            <Field label="New password (8+ characters)"><input type="password" required minLength={8} autoComplete="new-password" value={r.password} onChange={(e) => setR({ ...r, password: e.target.value })} /></Field>
            <Field label="Confirm new password"><input type="password" required minLength={8} autoComplete="new-password" value={r.password2} onChange={(e) => setR({ ...r, password2: e.target.value })} /></Field>
            <button className="btn btn-primary btn-lg" disabled={busy}><Icon n="lock" s={16} /> Reset password</button>
          </form>
          <p className="help center"><a href="#" onClick={(e) => { e.preventDefault(); go('login'); }}>← Login par wapas jaayein</a></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <img src="/logo.webp" alt="" width="44" height="44" className="auth-logo" />
        <h1>Welcome back</h1>
        <p className="muted">Deific Digital admin panel me login karein</p>
        {ok && <div className="alert alert-success"><span>{ok}</span></div>}
        {err && <div className="alert alert-error"><span>{err}</span></div>}
        <form className="stack" onSubmit={submit}>
          <Field label="Username"><input name="username" required autoFocus autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></Field>
          <Field label="Password"><input name="password" type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          <button className="btn btn-primary btn-lg" disabled={busy}><Icon n="lock" s={16} /> Log in</button>
        </form>
        <p className="help center"><a href="#" onClick={(e) => { e.preventDefault(); go('forgot'); }}>Forgot password?</a></p>
      </div>
    </div>
  );
}
