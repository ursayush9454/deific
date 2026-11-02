import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Icon, Alerts } from '../ui.jsx';
import { useAuth } from '../App.jsx';

const NAV = [
  ['/', 'Dashboard', 'home', true],
  ['/blogs', 'Blogs', 'blog'],
  ['/products', 'Products', 'box'],
  ['/media', 'Media Library', 'image'],
];
const ADMIN_NAV = [
  ['/backups', 'Backups', 'archive'],
  ['/users', 'Users', 'users'],
  ['/activity', 'Activity Log', 'activity'],
  ['/settings', 'Settings', 'settings'],
];

export default function Layout({ title, actions, children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const item = ([to, label, icon, end]) => (
    <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')} onClick={() => setOpen(false)}>
      <Icon n={icon} /><span>{label}</span>
    </NavLink>
  );
  return (
    <div className="app" onClick={(e) => open && !e.target.closest('#side') && !e.target.closest('.menu-btn') && setOpen(false)}>
      <aside className={'side' + (open ? ' open' : '')} id="side">
        <Link className="brand" to="/"><img src="/logo.webp" alt="" width="32" height="32" /><span>Deific <b>Digital</b><small>Admin panel</small></span></Link>
        <nav>
          <p className="nav-h">Content</p>
          {NAV.map(item)}
          {user.role === 'admin' && (<><p className="nav-h">Manage</p>{ADMIN_NAV.map(item)}</>)}
        </nav>
        <div className="side-foot">
          <a href="/" target="_blank" rel="noopener" className="visit"><Icon n="globe" s={16} /> View website</a>
          <div className="me">
            <Link to="/account" className="me-link">
              <span className="avatar">{(user.name || user.username).slice(0, 1).toUpperCase()}</span>
              <span><b>{user.name}</b><small>{user.role === 'admin' ? 'Admin' : 'Editor'}</small></span>
            </Link>
            <button className="icon-btn" title="Log out" aria-label="Log out" onClick={logout}><Icon n="logout" s={17} /></button>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="top">
          <button className="icon-btn menu-btn" type="button" aria-label="Menu" onClick={() => setOpen(!open)}><Icon n="menu" /></button>
          <h1>{title}</h1>
          <div className="top-actions">{actions}</div>
        </header>
        <div className="content">
          <Alerts />
          {children}
        </div>
      </div>
    </div>
  );
}
