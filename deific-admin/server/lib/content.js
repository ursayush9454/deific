// Turn submitted JSON from the React editor into clean records.
import sanitizeHtml from 'sanitize-html';
import fs from 'node:fs';
import path from 'node:path';
import { slugify, newId, today, nowIso, blogs, products, projects, UPLOAD_DIR, UPLOAD_REL } from './core.js';
import { slugTakenBySite } from './render.js';
import { cloudEnabled, cloudUpload } from './cloud.js';

const str = (v, max = 5000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const lines = (v, max = 20) =>
  (Array.isArray(v) ? v : String(v || '').split(/\r?\n/)).map((s) => String(s).trim()).filter(Boolean).slice(0, max);

export function cleanHtml(html) {
  const out = sanitizeHtml(String(html || ''), {
    allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote',
      'pre', 'code', 'img', 'figure', 'figcaption', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'sub', 'sup', 'iframe'],
    allowedAttributes: {
      '*': ['class'],
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      iframe: ['src', 'width', 'height', 'allowfullscreen', 'frameborder'],
      td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com', 'www.google.com'],
    transformTags: {
      a: (tag, attribs) => ({ tagName: 'a', attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener' } : attribs }),
      img: (tag, attribs) => ({ tagName: 'img', attribs: { loading: 'lazy', ...attribs } }),
    },
  });
  // drop empty editor lines (<p><br></p>) that become big gaps on the site
  return out.replace(/<p>(\s|<br\s*\/?>|&nbsp;)*<\/p>/gi, '').trim();
}

export function cleanImagePath(p) {
  p = str(p, 500);
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  p = p.replace(/^\/+/, '');
  if (p.includes('..')) return '';
  return /^[A-Za-z0-9_\-./]+$/.test(p) ? p : '';
}

function faqs(v) {
  return (Array.isArray(v) ? v : [])
    .map((f) => ({ q: str(f?.q, 300), a: str(f?.a, 2000) }))
    .filter((f) => f.q || f.a)
    .slice(0, 30);
}

export function blogFromBody(b, old, user) {
  const title = str(b.title, 200);
  let status = ['draft', 'published', 'scheduled'].includes(b.status) ? b.status : 'draft';
  let date = /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : today();
  if (status === 'scheduled' && date <= today()) status = 'published';
  const tags = [...new Set(String(b.tags || '').split(',').map((t) => t.trim().slice(0, 40)).filter(Boolean))].slice(0, 15);
  return {
    id: old?.id || newId(),
    title,
    slug: slugify(str(b.slug, 100) || title),
    category: str(b.category, 60),
    tags,
    author: str(b.author, 80),
    date,
    status,
    featured: !!b.featured,
    cover: cleanImagePath(b.cover),
    cover_alt: str(b.cover_alt, 200),
    emoji: [...str(b.emoji, 16)].slice(0, 2).join(''),
    excerpt: str(b.excerpt, 300),
    quick_answer: str(b.quick_answer, 1500),
    content: cleanHtml(b.content),
    faqs: faqs(b.faqs),
    seo_title: str(b.seo_title, 120),
    seo_desc: str(b.seo_desc, 320),
    noindex: !!b.noindex,
    created_at: old?.created_at || nowIso(),
    created_by: old?.created_by || user,
    updated_at: nowIso(),
  };
}

export function productFromBody(b, old, user) {
  const name = str(b.name, 120);
  return {
    id: old?.id || newId(),
    name,
    slug: slugify(str(b.slug, 100) || name),
    category: str(b.category, 60),
    audience: str(b.audience, 160),
    summary: str(b.summary, 400),
    headline: str(b.headline, 200),
    subheadline: str(b.subheadline, 400),
    image: cleanImagePath(b.image),
    image_alt: str(b.image_alt, 200),
    features: lines(b.features),
    problem: str(b.problem, 1000),
    who: lines(b.who),
    steps: lines(b.steps, 12),
    details: cleanHtml(b.details),
    faqs: faqs(b.faqs),
    price: str(b.price, 80),
    price_value: String(b.price_value ?? '').replace(/[^0-9.]/g, '').slice(0, 20),
    currency: String(b.currency || 'INR').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'INR',
    cta_label: str(b.cta_label, 60),
    cta_link: str(b.cta_link, 300),
    status: ['draft', 'published'].includes(b.status) ? b.status : 'draft',
    show_in_listing: b.show_in_listing !== false,
    sort: Number.parseInt(b.sort, 10) || 0,
    seo_title: str(b.seo_title, 120),
    seo_desc: str(b.seo_desc, 320),
    noindex: !!b.noindex,
    created_at: old?.created_at || nowIso(),
    created_by: old?.created_by || user,
    updated_at: nowIso(),
  };
}


const hexColor = (v) => (/^#[0-9a-fA-F]{6}$/.test(String(v || '').trim()) ? String(v).trim().toLowerCase() : '');

function cleanUrl(v) {
  let u = str(v, 300);
  if (!u) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
  if (!/^https?:\/\/[^\s"'<>]+$/i.test(u)) return '';
  return u;
}

// "70,000 | E-rickshaws registered"  ->  { value, label }
function statList(v) {
  return lines(v, 4)
    .map((l) => {
      const [value, ...rest] = String(l).split('|');
      return { value: value.trim().slice(0, 30), label: rest.join('|').trim().slice(0, 60) };
    })
    .filter((x) => x.value);
}

export function projectFromBody(b, old, user) {
  const title = str(b.title, 160);
  return {
    id: old?.id || newId(),
    title,
    slug: slugify(str(b.slug, 100) || title),
    client: str(b.client, 120),
    category: str(b.category, 80),
    summary: str(b.summary, 500),
    image: cleanImagePath(b.image),
    image_alt: str(b.image_alt, 200),
    color_from: hexColor(b.color_from),
    color_to: hexColor(b.color_to),
    stats: statList(b.stats),
    techs: lines(b.techs, 10).map((t) => t.slice(0, 30)),
    subtitle: str(b.subtitle, 200),
    website: cleanUrl(b.website),
    case_study: cleanHtml(b.case_study),
    outcome: str(b.outcome, 1500),
    status: ['draft', 'published'].includes(b.status) ? b.status : 'draft',
    sort: Number.parseInt(b.sort, 10) || 0,
    created_at: old?.created_at || nowIso(),
    created_by: old?.created_by || user,
    updated_at: nowIso(),
  };
}

/** Unique among admin items and never clashing with original site pages. */
export function uniqueSlug(type, slug, selfId) {
  const list = type === 'blog' ? blogs() : type === 'project' ? projects() : products();
  const base = slug;
  let i = 2;
  for (;;) {
    // projects have no page of their own: slug is only the #anchor on /portfolio
    const clash = type === 'project'
      ? list.some((x) => x.slug === slug && x.id !== selfId)
      : slugTakenBySite(type, slug) || list.some((x) => x.slug === slug && x.id !== selfId) || (type === 'product' && slug === 'prop-ai');
    if (!clash) return slug;
    slug = `${base}-${i++}`;
  }
}

/* ---------------- image uploads ---------------- */
let sharp = null;
try { sharp = (await import('sharp')).default; } catch { sharp = null; }
export const canWebp = () => !!sharp;

function uniqueName(dir, base, ext) {
  let name = `${base}.${ext}`, i = 2;
  while (fs.existsSync(path.join(dir, name))) name = `${base}-${i++}.${ext}`;
  return name;
}

export async function saveImage(file) {
  const orig = file.originalname || 'image';
  const ext = path.extname(orig).slice(1).toLowerCase();
  const base = slugify(path.basename(orig, path.extname(orig))) || 'image';
  const now = new Date();
  const sub = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dir = path.join(UPLOAD_DIR, sub);
  fs.mkdirSync(dir, { recursive: true });

  if (ext === 'svg' || file.mimetype === 'image/svg+xml') {
    const svg = file.buffer.toString('utf8');
    if (/<script|\son\w+\s*=|javascript:/i.test(svg)) throw new Error('Yeh SVG safe nahi hai.');
    if (cloudEnabled()) return cloudUpload(Buffer.from(svg), base, true);
    const name = uniqueName(dir, base, 'svg');
    fs.writeFileSync(path.join(dir, name), svg);
    return `${UPLOAD_REL}/${sub}/${name}`;
  }
  const sig = file.buffer.subarray(0, 12);
  const kind =
    sig[0] === 0xff && sig[1] === 0xd8 ? 'jpg'
    : sig.subarray(0, 4).toString('hex') === '89504e47' ? 'png'
    : sig.subarray(0, 3).toString() === 'GIF' ? 'gif'
    : sig.subarray(0, 4).toString() === 'RIFF' && sig.subarray(8, 12).toString() === 'WEBP' ? 'webp'
    : null;
  if (!kind) throw new Error('Sirf JPG, PNG, WebP, GIF ya SVG allowed hai.');
  if (cloudEnabled()) return cloudUpload(file.buffer, base, kind === 'gif');

  if (sharp && kind !== 'gif') {
    try {
      const buf = await sharp(file.buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      const name = uniqueName(dir, base, 'webp');
      fs.writeFileSync(path.join(dir, name), buf);
      return `${UPLOAD_REL}/${sub}/${name}`;
    } catch { /* fall through and keep the original */ }
  }
  const name = uniqueName(dir, base, kind);
  fs.writeFileSync(path.join(dir, name), file.buffer);
  return `${UPLOAD_REL}/${sub}/${name}`;
}
