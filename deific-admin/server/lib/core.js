// Config, flat-file JSON store, settings, helpers, activity log, backups.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { NAMES as DB_NAMES, dbEnabled, cacheGet, cachePut } from './db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const APP_DIR = path.resolve(here, '..', '..');
export const SITE_DIR = path.resolve(APP_DIR, process.env.SITE_DIR || '../website');
export const DATA_DIR = path.resolve(APP_DIR, process.env.DATA_DIR || 'data');
export const BACKUP_DIR = path.join(DATA_DIR, 'backups');
export const UPLOAD_REL = 'assets/uploads';
export const UPLOAD_DIR = path.join(SITE_DIR, UPLOAD_REL);
export const MANAGED_MARK = '<!-- ddadmin:managed -->';
export const VERSION = '1.0.0';

for (const d of [DATA_DIR, BACKUP_DIR]) fs.mkdirSync(d, { recursive: true });

/* ---------------- JSON store ---------------- */
const dbPath = (name) => path.join(DATA_DIR, name.replace(/[^a-z0-9_]/g, '') + '.json');

// MONGODB_URI set ho to ye 6 collections MongoDB me jaati hain, warna data/*.json files me.
const inDb = (name) => dbEnabled() && DB_NAMES.includes(name);

export function dbGet(name, def = []) {
  if (inDb(name)) return cacheGet(name, def);
  try {
    return JSON.parse(fs.readFileSync(dbPath(name), 'utf8'));
  } catch {
    return def;
  }
}

export function dbPut(name, data) {
  if (inDb(name)) return cachePut(name, data);
  atomicWrite(dbPath(name), JSON.stringify(data, null, 2));
}

export function atomicWrite(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp' + crypto.randomBytes(3).toString('hex');
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

export function relPath(abs) {
  return path.relative(SITE_DIR, abs).split(path.sep).join('/');
}

/* ---------------- settings ---------------- */
export function defaultSettings() {
  return {
    site_name: 'Deific Digital',
    site_url: process.env.SITE_URL || 'https://deificdigital.com',
    whatsapp: '918750200899',
    default_author: 'Deific Digital',
    blog_template: 'blog/how-to-choose-the-right-digital-agency/index.html',
    product_template: 'products/ai-sales-agent/index.html',
    update_sitemap: true,
    max_backups: 60,
  };
}

export function settings() {
  return { ...defaultSettings(), ...dbGet('settings', {}) };
}

export function saveSettings(patch) {
  dbPut('settings', { ...settings(), ...patch });
}

export function secret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const f = path.join(DATA_DIR, '.secret');
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(48).toString('hex'), { mode: 0o600 });
  return fs.readFileSync(f, 'utf8').trim();
}

/* ---------------- helpers ---------------- */
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]);

export function slugify(s) {
  const out = String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
  return out || 'item-' + Date.now().toString(36);
}

export const newId = () => new Date().toISOString().slice(2, 10).replace(/-/g, '') + crypto.randomBytes(4).toString('hex');
export const today = () => {
  const d = new Date();
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
};
export const nowIso = () => new Date().toISOString();

export function niceDate(ymd) {
  const d = new Date(ymd + 'T00:00:00');
  if (isNaN(d)) return ymd;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function readMinutes(html) {
  const words = String(html || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function humanSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return Math.round(b / 1024) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

/* ---------------- activity ---------------- */
export function logActivity(user, action, detail = '', ip = '') {
  const log = dbGet('activity', []);
  log.unshift({ at: nowIso(), user: user || 'system', action, detail, ip });
  dbPut('activity', log.slice(0, 300));
}

/* ---------------- backups ---------------- */
export function backupFile(rel, reason = 'auto') {
  const abs = path.join(SITE_DIR, rel);
  if (!fs.existsSync(abs)) return null;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const name = `${stamp}-${crypto.randomBytes(2).toString('hex')}__${rel.replace(/\//g, '~')}.bak`;
  fs.copyFileSync(abs, path.join(BACKUP_DIR, name));
  let meta = dbGet('backups', []);
  meta.unshift({ file: name, path: rel, at: nowIso(), reason, size: fs.statSync(abs).size });
  // first backup of each file = original version, kept forever
  const seen = new Set();
  for (let i = meta.length - 1; i >= 0; i--) {
    if (!seen.has(meta[i].path)) {
      meta[i].original = true;
      seen.add(meta[i].path);
    }
  }
  const max = Number(settings().max_backups) || 60;
  let count = 0;
  meta = meta.filter((m) => {
    if (m.original) return true;
    if (count < max) return ++count;
    try { fs.unlinkSync(path.join(BACKUP_DIR, m.file)); } catch {}
    return false;
  });
  dbPut('backups', meta);
  return name;
}

/* ---------------- content ---------------- */
export const blogs = () => dbGet('blogs', []);
export const products = () => dbGet('products', []);
export const projects = () => dbGet('projects', []);

export function mediaList() {
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.(webp|jpe?g|png|gif|svg)$/i.test(ent.name)) {
        const st = fs.statSync(p);
        out.push({ path: relPath(p), name: ent.name, size: st.size, mtime: st.mtimeMs });
      }
    }
  };
  walk(UPLOAD_DIR);
  return out.sort((a, b) => b.mtime - a.mtime);
}

export function isWritable(p) {
  try {
    fs.accessSync(p, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/* ---------------- .env credentials + recovery key ---------------- */
const ENV_FILE = path.join(APP_DIR, '.env');

// dotenv-safe quoting: pick a quote char that is not inside the value.
function envQuote(v) {
  for (const q of ['"', "'", '`']) if (!v.includes(q) && !/[\r\n]/.test(v)) return q + v + q;
  throw new Error('Value me quotes aur new-line saath me nahi ho sakte.');
}

export function setEnvVars(vars) {
  let text = '';
  try { text = fs.readFileSync(ENV_FILE, 'utf8'); } catch {}
  for (const [k, v] of Object.entries(vars)) {
    const line = `${k}=${envQuote(String(v))}`;
    const re = new RegExp(`^${k}=.*$`, 'm');
    text = re.test(text) ? text.replace(re, () => line) : text.replace(/\s*$/, '\n') + line + '\n';
    process.env[k] = String(v);
  }
  atomicWrite(ENV_FILE, text.replace(/^\n+/, ''));
  try { fs.chmodSync(ENV_FILE, 0o600); } catch {}
}

// Last admin login (plain text) is kept in .env so it can be looked up if forgotten.
export function saveCredsToEnv(username, password) {
  try {
    setEnvVars({ ADMIN_USERNAME: username, ADMIN_PASSWORD: password });
    return true;
  } catch (e) {
    console.warn('[!] .env me credentials save nahi ho paye:', e.message);
    return false;
  }
}

// Secret key used by the "Forgot password" screen. Generated once and stored in .env.
export function recoveryKey() {
  if (!process.env.RECOVERY_KEY) {
    setEnvVars({ RECOVERY_KEY: crypto.randomBytes(12).toString('hex') });
    console.log(`\n  [i] Naya RECOVERY_KEY .env me bana diya gaya: ${ENV_FILE}\n`);
  }
  return process.env.RECOVERY_KEY;
}

export function checkRecoveryKey(given) {
  const a = Buffer.from(String(given || '').trim());
  const b = Buffer.from(recoveryKey());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
