import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { api } from './api.js';
import { NoticeProvider } from './ui.jsx';
import Setup from './pages/Setup.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ItemList from './pages/ItemList.jsx';
import BlogEdit from './pages/BlogEdit.jsx';
import ProductEdit from './pages/ProductEdit.jsx';
import Media from './pages/Media.jsx';
import Backups from './pages/Backups.jsx';
import Users from './pages/Users.jsx';
import Activity from './pages/Activity.jsx';
import Account from './pages/Account.jsx';
import Settings from './pages/Settings.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function Shell() {
  const [status, setStatus] = useState(null);
  const nav = useNavigate();
  const refresh = useCallback(() => api.get('/status').then(setStatus).catch(() => setStatus({ error: true })), []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => setStatus((s) => (s ? { ...s, user: null } : s));
    window.addEventListener('dda:logout', h);
    return () => window.removeEventListener('dda:logout', h);
  }, []);
  const logout = async () => {
    await api.post('/logout').catch(() => {});
    setStatus((s) => ({ ...s, user: null }));
    nav('/');
  };

  if (!status) return <div className="boot">Loading…</div>;
  if (status.error) return <div className="boot">Server se connect nahi ho paya. Node server chal raha hai?</div>;
  if (status.setup) return <Setup checks={status.checks} siteUrl={status.site_url} onDone={refresh} />;
  if (!status.user) return <Login onDone={refresh} />;

  const admin = status.user.role === 'admin';
  const guard = (el) => (admin ? el : <Navigate to="/" replace />);
  return (
    <AuthCtx.Provider value={{ user: status.user, logout, refresh }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/blogs" element={<ItemList kind="blogs" />} />
        <Route path="/blogs/new" element={<BlogEdit />} />
        <Route path="/blogs/:id" element={<BlogEdit />} />
        <Route path="/products" element={<ItemList kind="products" />} />
        <Route path="/products/new" element={<ProductEdit />} />
        <Route path="/products/:id" element={<ProductEdit />} />
        <Route path="/media" element={<Media />} />
        <Route path="/account" element={<Account />} />
        <Route path="/backups" element={guard(<Backups />)} />
        <Route path="/users" element={guard(<Users />)} />
        <Route path="/activity" element={guard(<Activity />)} />
        <Route path="/settings" element={guard(<Settings />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthCtx.Provider>
  );
}

export default function App() {
  return (
    <NoticeProvider>
      <Shell />
    </NoticeProvider>
  );
}
