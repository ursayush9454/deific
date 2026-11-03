// Deific Digital Admin - Express server
// Serves the React admin at /admin, its JSON API at /admin/api, and (optionally) the website itself.
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  APP_DIR, SITE_DIR, DATA_DIR, BACKUP_DIR, UPLOAD_DIR, UPLOAD_REL, VERSION,
  dbGet, dbPut, settings, saveSettings, secret, blogs, products, projects, mediaList, logActivity,
  backupFile, atomicWrite, isWritable, newId, nowIso, today,
  saveCredsToEnv, recoveryKey, checkRecoveryKey,
} from './lib/core.js';
import {
  loadTemplate, templateDepthOk, staticBlogs, staticProducts, published, sortedBlogs, sortedProducts,
  renderBlogPage, renderProductPage, removePage, syncType, runScheduler, staticProjects, sortedProjects,
} from './lib/render.js';
import { cloudEnabled, cloudList, cloudDelete, cloudId } from './lib/cloud.js';
import { blogFromBody, productFromBody, projectFromBody, uniqueSlug, saveImage, canWebp } from './lib/content.js';
import { connectDb, dbEnabled, flushDb, closeDb, dbLastError } from './lib/db.js';

// MongoDB (agar MONGODB_URI set hai) - data load hone ke baad hi server chalega
try {
  if (await connectDb(DATA_DIR)) console.log('  [db] MongoDB connected');
} catch (e) {
  console.error('\n[!] MongoDB se connect nahi ho paya:', e.message, '\n    MONGODB_URI check karein (Atlas me IP allow-list bhi). Server band ho raha hai taaki data na khoye.\n');
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 3000;
const SERVE_SITE = process.env.SERVE_SITE !== 'false';
const SECURE_COOKIE = process.env.COOKIE_SECURE === 'true';
const DIST = path.join(APP_DIR, 'dist');

if (!fs.existsSync(path.join(SITE_DIR, 'index.html'))) {
  console.warn(`\n[!] Website folder nahi mila: ${SITE_DIR}\n    .env me SITE_DIR sahi set karein (jis folder me index.html, blog/, products/ hain).\n`);
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(cookieParser());

/* ======================= API ======================= */
const api = express.Router();
api.use(express.json({ limit: '4mb' }));
api.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  // CSRF: browsers can't send this custom header cross-site without CORS, which we never allow.
  if (req.method !== 'GET' && req.get('X-Requested-With') !== 'fetch') return res.status(403).json({ error: 'Bad request' });
  next();
});

const users = () => dbGet('users', {});
const ip = (req) => req.ip || req.socket.remoteAddress || '';
const COOKIE = 'dda_session';

function setSession(res, username) {
  const token = jwt.sign({ u: username }, secret(), { expiresIn: '8h' });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: SECURE_COOKIE, path: '/admin', maxAge: 8 * 3600 * 1000 });
}

function currentUser(req) {
  try {
    const { u } = jwt.verify(req.cookies[COOKIE] || '', secret());
    const all = users();
    return all[u] ? { username: u, name: all[u].name || u, role: all[u].role || 'editor' } : null;
  } catch {
    return null;
  }
}

const auth = (req, res, next) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: 'Login expire ho gaya. Dobara login karein.' });
  req.user = u;
  next();
};
const adminOnly = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Yeh sirf Admin ke liye hai.' }));
const log = (req, action, detail = '') => logActivity(req.user?.username, action, detail, ip(req));
const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((e) => res.status(400).json({ error: e.message || 'Error' }));

/* ---- login throttling (in memory) ---- */
const attempts = new Map();
const locked = (k) => {
  const a = attempts.get(k);
  return a && a.count >= 5 && Date.now() - a.last < 15 * 60 * 1000;
};
const failed = (k) => {
  const a = attempts.get(k) || { count: 0, last: 0 };
  if (Date.now() - a.last > 15 * 60 * 1000) a.count = 0;
  a.count++;
  a.last = Date.now();
  attempts.set(k, a);
};

const validUser = (u) => /^[a-z0-9_.-]{3,40}$/.test(u);

api.get('/status', (req, res) => {
  const needsSetup = Object.keys(users()).length === 0;
  res.json({
    setup: needsSetup, user: currentUser(req), version: VERSION,
    checks: needsSetup ? health() : undefined, site_url: settings().site_url,
  });
});

api.post('/setup', wrap(async (req, res) => {
  if (Object.keys(users()).length) return res.status(400).json({ error: 'Setup already ho chuka hai.' });
  const u = String(req.body.username || '').toLowerCase().trim();
  const p = String(req.body.password || '');
  if (!validUser(u)) throw new Error('Username 3-40 characters ka ho (a-z, 0-9, _ . -).');
  if (p.length < 8) throw new Error('Password kam se kam 8 characters ka rakhein.');
  dbPut('users', { [u]: { hash: await bcrypt.hash(p, 11), role: 'admin', name: String(req.body.name || u).slice(0, 80), created: nowIso() } });
  const site = String(req.body.site_url || '').trim();
  if (/^https?:\/\//.test(site)) saveSettings({ site_url: site.replace(/\/+$/, '') });
  saveCredsToEnv(u, p);
  setSession(res, u);
  logActivity(u, 'Setup complete', 'Admin account created', ip(req));
  res.json({ ok: true });
}));

api.post('/login', wrap(async (req, res) => {
  const key = ip(req);
  if (locked(key)) return res.status(429).json({ error: 'Bahut saare galat attempts. 15 minute baad try karein.' });
  const u = String(req.body.username || '').toLowerCase().trim();
  const all = users();
  if (all[u] && (await bcrypt.compare(String(req.body.password || ''), all[u].hash))) {
    attempts.delete(key);
    all[u].last_login = nowIso();
    dbPut('users', all);
    setSession(res, u);
    logActivity(u, 'Login', '', key);
    return res.json({ ok: true });
  }
  failed(key);
  await new Promise((r) => setTimeout(r, 400));
  res.status(401).json({ error: 'Username ya password galat hai.' });
}));

api.post('/forgot-password', wrap(async (req, res) => {
  const key = 'fp:' + ip(req);
  if (locked(key)) return res.status(429).json({ error: 'Bahut saare galat attempts. 15 minute baad try karein.' });
  const u = String(req.body.username || '').toLowerCase().trim();
  const p = String(req.body.password || '');
  const all = users();
  if (!all[u] || !checkRecoveryKey(req.body.key)) {
    failed(key);
    await new Promise((r) => setTimeout(r, 400));
    throw new Error('Username ya Recovery Key galat hai.');
  }
  if (p.length < 8) throw new Error('Naya password 8+ characters ka rakhein.');
  all[u].hash = await bcrypt.hash(p, 11);
  dbPut('users', all);
  attempts.delete(key);
  attempts.delete(ip(req));
  if (all[u].role === 'admin') saveCredsToEnv(u, p);
  logActivity(u, 'Password reset', 'Forgot password (recovery key)', ip(req));
  res.json({ ok: true });
}));

api.post('/logout', (req, res) => {
  const u = currentUser(req);
  if (u) logActivity(u.username, 'Logout', '', ip(req));
  res.clearCookie(COOKIE, { path: '/admin' });
  res.json({ ok: true });
});

/* ---- everything below needs login ---- */
api.use(auth);

// lazily publish scheduled posts on admin activity too
api.use((req, res, next) => {
  try { runScheduler(); } catch {}
  next();
});

function health() {
  const t = (type) => { try { loadTemplate(type); return true; } catch { return false; } };
  return [
    ['Website folder found', fs.existsSync(path.join(SITE_DIR, 'index.html'))],
    ['blog/ folder writable', isWritable(path.join(SITE_DIR, 'blog'))],
    ['products/ folder writable', isWritable(path.join(SITE_DIR, 'products'))],
    ['portfolio/ folder writable', isWritable(path.join(SITE_DIR, 'portfolio'))],
    ['Image uploads folder', isWritable(fs.existsSync(UPLOAD_DIR) ? UPLOAD_DIR : path.join(SITE_DIR, 'assets'))],
    ['WebP image conversion (sharp)', canWebp()],
    ['Blog page template', t('blog')],
    ['Product page template', t('product')],
  ];
}

api.get('/meta', (req, res) => {
  const s = settings();
  const cats = (list, extra) => [...new Set([...list.map((x) => x.category).filter(Boolean), ...extra])];
  res.json({
    site_url: s.site_url, site_name: s.site_name, default_author: s.default_author, today: today(),
    blogCategories: cats([...blogs(), ...staticBlogs()], ['AI & Automation', 'Software Development', 'Digital Marketing', 'Agency Guide', 'Company News', 'Case Study']),
    productCategories: cats([...products(), ...staticProducts()], ['Healthcare', 'Real estate', 'Sales', 'Support', 'E-commerce', 'Education', 'Finance']),
    projectCategories: cats([...projects(), ...staticProjects()], ['Government', 'Mobile App', 'Website', 'E-commerce', 'AI & Automation', 'Retail', 'Healthcare', 'Education']),
  });
});

api.get('/dashboard', (req, res) => {
  const b = blogs(), p = products(), pr = projects(), media = mediaList();
  const count = (l, s) => l.filter((x) => x.status === s).length;
  const recent = [...b.map((x) => ({ ...x, _t: 'blog', _n: x.title })), ...p.map((x) => ({ ...x, _t: 'product', _n: x.name })), ...pr.map((x) => ({ ...x, _t: 'project', _n: x.title }))]
    .sort((x, y) => String(y.updated_at).localeCompare(String(x.updated_at)))
    .slice(0, 6)
    .map((x) => ({ id: x.id, type: x._t, name: x._n, status: x.status, updated_at: x.updated_at }));
  res.json({
    blogs: { live: count(b, 'published') + staticBlogs().length, drafts: count(b, 'draft'), scheduled: count(b, 'scheduled') },
    products: { live: count(p, 'published') + staticProducts().length, drafts: count(p, 'draft') },
    projects: { live: count(pr, 'published') + staticProjects().length, drafts: count(pr, 'draft') },
    media: { count: media.length, size: media.reduce((s, m) => s + m.size, 0) },
    activity: dbGet('activity', []).slice(0, 7),
    activityCount: dbGet('activity', []).length,
    recent,
    health: health(),
  });
});

/* ---- blogs + products (shared handlers) ---- */
const TYPES = {
  blogs: { type: 'blog', store: 'blogs', from: blogFromBody, label: (x) => x.title, need: 'title', needMsg: 'Title zaroori hai.', pages: true, sort: sortedBlogs, original: staticBlogs },
  products: { type: 'product', store: 'products', from: productFromBody, label: (x) => x.name, need: 'name', needMsg: 'Product name zaroori hai.', pages: true, sort: sortedProducts, original: staticProducts },
  // projects = sirf /portfolio par card (alag page nahi banta)
  projects: { type: 'project', store: 'projects', from: projectFromBody, label: (x) => x.title, need: 'title', needMsg: 'Project ka title zaroori hai.', pages: false, sort: sortedProjects, original: staticProjects },
};

for (const [route, T] of Object.entries(TYPES)) {
  api.get(`/${route}`, (req, res) => {
    res.json({ items: T.sort(dbGet(T.store, [])), original: T.original() });
  });

  api.get(`/${route}/:id`, (req, res) => {
    const it = dbGet(T.store, []).find((x) => x.id === req.params.id);
    it ? res.json(it) : res.status(404).json({ error: 'Nahi mila.' });
  });

  api.post(`/${route}`, wrap((req, res) => {
    const list = dbGet(T.store, []);
    const old = req.body.id ? list.find((x) => x.id === req.body.id) : null;
    const item = T.from(req.body, old, req.user.username);
    if (!item[T.need]) throw new Error(T.needMsg);
    item.slug = uniqueSlug(T.type, item.slug, item.id);
    if (T.pages && old && old.slug !== item.slug) removePage(T.type, old.slug);
    if (old) list[list.indexOf(old)] = item;
    else list.push(item);
    dbPut(T.store, list);
    const warnings = syncType(T.type);
    log(req, `${old ? 'Updated' : 'Created'} ${T.type}`, `${T.label(item)} [${item.status}]`);
    res.json({ ok: true, item, warnings });
  }));

  api.delete(`/${route}/:id`, wrap((req, res) => {
    const list = dbGet(T.store, []);
    const it = list.find((x) => x.id === req.params.id);
    if (!it) throw new Error('Nahi mila.');
    if (T.pages) removePage(T.type, it.slug);
    dbPut(T.store, list.filter((x) => x !== it));
    const warnings = syncType(T.type);
    log(req, `Deleted ${T.type}`, T.label(it));
    res.json({ ok: true, warnings });
  }));

  api.post(`/${route}/:id/duplicate`, wrap((req, res) => {
    const list = dbGet(T.store, []);
    const it = list.find((x) => x.id === req.params.id);
    if (!it) throw new Error('Nahi mila.');
    const copy = { ...structuredClone(it), id: newId(), status: 'draft', created_at: nowIso(), updated_at: nowIso() };
    copy[T.need] = `${it[T.need]} (copy)`;
    copy.slug = uniqueSlug(T.type, it.slug + '-copy', copy.id);
    list.push(copy);
    dbPut(T.store, list);
    log(req, `Duplicated ${T.type}`, copy[T.need]);
    res.json({ ok: true, item: copy });
  }));

  api.post(`/${route}/:id/toggle`, wrap((req, res) => {
    const list = dbGet(T.store, []);
    const it = list.find((x) => x.id === req.params.id);
    if (!it) throw new Error('Nahi mila.');
    it.status = it.status === 'published' ? 'draft' : 'published';
    it.updated_at = nowIso();
    dbPut(T.store, list);
    const warnings = syncType(T.type);
    log(req, `${it.status === 'published' ? 'Published' : 'Unpublished'} ${T.type}`, T.label(it));
    res.json({ ok: true, item: it, warnings });
  }));
}

api.post('/preview', wrap((req, res) => {
  const isBlog = req.body.type !== 'product';
  const item = isBlog ? blogFromBody(req.body, null, '') : productFromBody(req.body, null, '');
  if (req.body.id) item.id = req.body.id;
  if (isBlog && !item.title) item.title = 'Untitled post';
  if (!isBlog && !item.name) item.name = 'Untitled product';
  let html = isBlog ? renderBlogPage(item, published(blogs()), true) : renderProductPage(item, published(products()), true);
  const base = SERVE_SITE ? '/' : settings().site_url.replace(/\/+$/, '') + '/';
  html = html.replace(/<head([^>]*)>/, `<head$1><base href="${base}${isBlog ? 'blog' : 'products'}/${item.slug || 'preview'}/">`);
  html = html.replace(/<body([^>]*)>/, '<body$1><div style="position:fixed;left:0;right:0;top:0;z-index:2147483647;background:#0b1f4d;color:#fff;font:600 13px/1 system-ui,sans-serif;padding:10px 16px">PREVIEW · yeh page abhi live nahi hai</div><div style="height:34px"></div>');
  res.type('html').send(html);
}));

/* ---- media ---- */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 20 } });

api.get('/media', wrap(async (req, res) => {
  const local = mediaList().map((m) => ({ ...m, url: '/' + m.path }));
  let cloud = [];
  if (cloudEnabled()) {
    try { cloud = (await cloudList()).map((m) => ({ ...m, url: m.path })); } catch (e) { console.error('[cloudinary] list nahi hui:', e.message); }
  }
  res.json({ items: [...cloud, ...local].sort((a, b) => b.mtime - a.mtime) });
}));

api.post('/media', upload.array('file', 20), wrap(async (req, res) => {
  if (!req.files?.length) throw new Error('Koi file nahi mili.');
  const files = [];
  for (const f of req.files) {
    const p = await saveImage(f);
    files.push({ path: p, url: /^https?:\/\//.test(p) ? p : '/' + p });
  }
  log(req, 'Uploaded image', files.map((f) => f.path).join(', '));
  res.json({ ok: true, files });
}));

api.delete('/media', wrap(async (req, res) => {
  const raw = String(req.query.path || '');
  const id = cloudId(raw); // Cloudinary image ho to uska public_id, warna null
  const rel = raw.replace(/^\/+/, '');
  if (!id && (!rel.startsWith(UPLOAD_REL + '/') || rel.includes('..'))) throw new Error('Sirf uploads ki images delete ho sakti hain.');
  const key = id || rel;
  const used = [
    ...blogs().filter((b) => JSON.stringify(b).includes(key)).map((b) => b.title),
    ...products().filter((p) => JSON.stringify(p).includes(key)).map((p) => p.name),
    ...projects().filter((p) => JSON.stringify(p).includes(key)).map((p) => p.title),
  ];
  if (used.length) throw new Error('Yeh image in me use ho rahi hai: ' + used.join(', ') + '. Pehle wahan se hatayein.');
  if (id) await cloudDelete(id);
  else fs.rmSync(path.join(SITE_DIR, rel), { force: true });
  log(req, 'Deleted image', id || rel);
  res.json({ ok: true });
}));

/* ---- account ---- */
api.post('/account', wrap((req, res) => {
  const all = users();
  all[req.user.username].name = String(req.body.name || req.user.username).slice(0, 80);
  dbPut('users', all);
  res.json({ ok: true });
}));

api.post('/account/password', wrap(async (req, res) => {
  const all = users();
  const me = all[req.user.username];
  if (!(await bcrypt.compare(String(req.body.current || ''), me.hash))) throw new Error('Current password galat hai.');
  if (String(req.body.password || '').length < 8) throw new Error('Naya password 8+ characters ka rakhein.');
  me.hash = await bcrypt.hash(String(req.body.password), 11);
  dbPut('users', all);
  if (me.role === 'admin') saveCredsToEnv(req.user.username, String(req.body.password));
  log(req, 'Changed password');
  res.json({ ok: true });
}));

/* ---- admin only ---- */
api.get('/users', adminOnly, (req, res) => {
  res.json({ items: Object.entries(users()).map(([u, d]) => ({ username: u, name: d.name, role: d.role, last_login: d.last_login, created: d.created })) });
});

api.post('/users', adminOnly, wrap(async (req, res) => {
  const all = users();
  const u = String(req.body.username || '').toLowerCase().trim();
  if (!validUser(u)) throw new Error('Username galat format me hai.');
  if (all[u]) throw new Error('Yeh username already hai.');
  if (String(req.body.password || '').length < 8) throw new Error('Password 8+ characters ka rakhein.');
  const role = req.body.role === 'admin' ? 'admin' : 'editor';
  all[u] = { hash: await bcrypt.hash(String(req.body.password), 11), role, name: String(req.body.name || u).slice(0, 80), created: nowIso() };
  dbPut('users', all);
  if (role === 'admin') saveCredsToEnv(u, String(req.body.password));
  log(req, 'Added user', `${u} (${role})`);
  res.json({ ok: true });
}));

api.delete('/users/:u', adminOnly, wrap((req, res) => {
  if (req.params.u === req.user.username) throw new Error('Aap khud ko delete nahi kar sakte.');
  const all = users();
  delete all[req.params.u];
  dbPut('users', all);
  log(req, 'Deleted user', req.params.u);
  res.json({ ok: true });
}));

api.post('/users/:u/password', adminOnly, wrap(async (req, res) => {
  const all = users();
  if (!all[req.params.u]) throw new Error('User nahi mila.');
  if (String(req.body.password || '').length < 8) throw new Error('Password 8+ characters ka rakhein.');
  all[req.params.u].hash = await bcrypt.hash(String(req.body.password), 11);
  dbPut('users', all);
  if (all[req.params.u].role === 'admin') saveCredsToEnv(req.params.u, String(req.body.password));
  log(req, 'Reset password', req.params.u);
  res.json({ ok: true });
}));

api.get('/activity', adminOnly, (req, res) => res.json({ items: dbGet('activity', []) }));
api.get('/backups', adminOnly, (req, res) => res.json({ items: dbGet('backups', []) }));

api.post('/backups/restore', adminOnly, wrap((req, res) => {
  const m = dbGet('backups', []).find((x) => x.file === path.basename(String(req.body.file || '')));
  if (!m || !fs.existsSync(path.join(BACKUP_DIR, m.file))) throw new Error('Backup nahi mila.');
  backupFile(m.path, 'before restore');
  atomicWrite(path.join(SITE_DIR, m.path), fs.readFileSync(path.join(BACKUP_DIR, m.file)));
  log(req, 'Restored backup', `${m.path} from ${m.at}`);
  res.json({ ok: true, path: m.path });
}));

api.get('/backups/download', adminOnly, (req, res) => {
  const file = path.basename(String(req.query.file || ''));
  const abs = path.join(BACKUP_DIR, file);
  if (!file.endsWith('.bak') || !fs.existsSync(abs)) return res.status(404).end();
  res.download(abs, file.replace(/\.bak$/, ''));
});

api.get('/settings', adminOnly, (req, res) => res.json({ ...settings(), version: VERSION, site_dir: SITE_DIR, data_dir: DATA_DIR, serve_site: SERVE_SITE, storage: dbEnabled() ? 'MongoDB' : 'JSON files', db_error: dbLastError() }));

api.post('/settings', adminOnly, wrap((req, res) => {
  const b = req.body;
  const patch = {
    site_name: String(b.site_name || 'Deific Digital').slice(0, 80),
    site_url: String(b.site_url || '').trim().replace(/\/+$/, ''),
    whatsapp: String(b.whatsapp || '').replace(/\D/g, ''),
    default_author: String(b.default_author || '').slice(0, 80),
    update_sitemap: !!b.update_sitemap,
    max_backups: Math.max(10, Math.min(500, Number(b.max_backups) || 60)),
  };
  if (!/^https?:\/\//.test(patch.site_url)) throw new Error('Site URL https:// se shuru hona chahiye.');
  for (const k of ['blog_template', 'product_template']) {
    const v = String(b[k] || '').trim().replace(/^\/+|\/+$/g, '');
    if (!v) continue;
    if (v.includes('..') || !fs.existsSync(path.join(SITE_DIR, v))) throw new Error(`${k}: file nahi mili (${v}).`);
    if (!templateDepthOk(v)) throw new Error(`${k}: template 2 folder deep hona chahiye (jaise blog/kuch-bhi/index.html).`);
    patch[k] = v;
  }
  saveSettings(patch);
  log(req, 'Updated settings');
  res.json({ ok: true });
}));

api.post('/rebuild', adminOnly, wrap((req, res) => {
  const warnings = [...syncType('blog'), ...syncType('product'), ...syncType('project')];
  log(req, 'Rebuilt all pages');
  res.json({ ok: true, warnings });
}));

api.get('/export', adminOnly, (req, res) => {
  log(req, 'Exported content');
  res.set('Content-Disposition', `attachment; filename="ddadmin-content-${today()}.json"`);
  res.json({ exported_at: nowIso(), version: VERSION, blogs: blogs(), products: products(), projects: projects() });
});

api.post('/import', adminOnly, wrap((req, res) => {
  const d = req.body;
  if (!Array.isArray(d?.blogs) || !Array.isArray(d?.products)) throw new Error('Yeh valid export file nahi hai.');
  dbPut('blogs', d.blogs);
  dbPut('products', d.products);
  if (Array.isArray(d.projects)) dbPut('projects', d.projects);
  const warnings = [...syncType('blog'), ...syncType('product'), ...(Array.isArray(d.projects) ? syncType('project') : [])];
  log(req, 'Imported content', `${d.blogs.length} blogs, ${d.products.length} products, ${(d.projects || []).length} projects`);
  res.json({ ok: true, warnings });
}));

app.use('/admin/api', api);
app.use('/admin/api', (req, res) => res.status(404).json({ error: 'Not found' }));

/* ======================= Admin UI ======================= */
app.use('/admin', (req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  next();
});
app.get('/admin', (req, res, next) => (req.originalUrl === '/admin' ? res.redirect(301, '/admin/') : next()));
app.use('/admin', express.static(DIST, { index: false, maxAge: '7d' }));
app.get(['/admin/', '/admin/*'], (req, res) => {
  const idx = path.join(DIST, 'index.html');
  if (!fs.existsSync(idx)) return res.status(500).send('Admin UI build nahi mila. "npm run build" chalayein.');
  res.set('Cache-Control', 'no-store').sendFile(idx);
});

/* Uploaded images are always available (editor previews need them). */
app.use('/' + UPLOAD_REL, express.static(UPLOAD_DIR, { maxAge: '30d' }));

/* ======================= Website (optional) ======================= */
if (SERVE_SITE) {
  // Same clean-URL behaviour as the site's .htaccess: /page -> /page/index.html, /page/ and /page/index.html -> /page
  const redirects = [];
  try {
    for (const line of fs.readFileSync(path.join(SITE_DIR, '_redirects'), 'utf8').split('\n')) {
      const [from, to, code] = line.trim().split(/\s+/);
      if (from && to && !from.includes('*')) redirects.push([from, to, Number(code) || 301]);
    }
  } catch {}
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const r = redirects.find(([f]) => f === req.path);
    if (r) return res.redirect(r[2], r[1]);
    if (req.path !== '/' && /\/index\.html$/.test(req.path)) return res.redirect(301, req.path.replace(/\/index\.html$/, '') || '/');
    if (req.path.length > 1 && req.path.endsWith('/')) return res.redirect(301, req.path.slice(0, -1));
    let p;
    try { p = decodeURIComponent(req.path); } catch { return next(); }
    if (p.includes('..')) return next();
    // Never expose the admin app itself (data/, .env, node_modules) even if it sits inside the website folder
    const target = path.resolve(SITE_DIR, '.' + p);
    if ([APP_DIR, DATA_DIR].some((d) => target === d || target.startsWith(d + path.sep))) return res.status(404).end();
    const asDir = path.join(SITE_DIR, p, 'index.html');
    if (!path.extname(p) && fs.existsSync(asDir)) return res.set('Cache-Control', 'public, max-age=300').sendFile(asDir);
    next();
  });
  app.use(express.static(SITE_DIR, { redirect: false, maxAge: '1h', dotfiles: 'ignore' }));
  app.use((req, res) => res.status(404).sendFile(path.join(SITE_DIR, 'index.html')));
}

/* ---- fixed admin from .env (works even if the username is forgotten) ---- */
function syncEnvAdmin() {
  const u = String(process.env.SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
  const p = String(process.env.SUPER_ADMIN_PASSWORD || '');
  if (!u && !p) return;
  if (!u || p.length < 8) return console.warn('[!] .env me SUPER_ADMIN_EMAIL aur SUPER_ADMIN_PASSWORD (8+ characters) dono chahiye.');
  const all = users();
  const cur = all[u];
  if (cur && cur.role === 'admin' && bcrypt.compareSync(p, cur.hash)) return;
  all[u] = { ...(cur || { name: 'Super Admin', created: nowIso() }), role: 'admin', hash: bcrypt.hashSync(p, 11) };
  dbPut('users', all);
  logActivity(u, 'Env admin synced', 'SUPER_ADMIN_* from .env', '');
  console.log(`  [i] .env wala admin ready: ${u}`);
}
try { syncEnvAdmin(); } catch (e) { console.warn('[!] SUPER_ADMIN sync fail:', e.message); }

try { recoveryKey(); } catch (e) { console.warn('[!] RECOVERY_KEY set nahi ho paya:', e.message); }

const server = app.listen(PORT, () => {
  console.log(`\n  Deific Digital Admin v${VERSION}`);
  console.log(`  Admin:   http://localhost:${PORT}/admin/`);
  if (SERVE_SITE) console.log(`  Website: http://localhost:${PORT}/`);
  console.log(`  Site folder: ${SITE_DIR}\n`);
  try { runScheduler(); } catch {}
  setInterval(() => { try { runScheduler(); } catch (e) { console.error('[scheduler]', e.message); } }, 30 * 60 * 1000).unref();
});

// Band hone se pehle pending DB writes poori save karo
async function shutdown() {
  server.close();
  try { await flushDb(); await closeDb(); } catch {}
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
