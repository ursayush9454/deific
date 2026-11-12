// Page generator: builds static pages that reuse the live site's own header,
// footer, scripts and stylesheet, so new pages look exactly like the rest.
import fs from 'node:fs';
import path from 'node:path';
import {
  SITE_DIR, DATA_DIR, MANAGED_MARK, settings, esc, niceDate, readMinutes, atomicWrite,
  backupFile, blogs, products, projects, dbGet, dbPut, today, nowIso, logActivity,
} from './core.js';

export const REGION_START = '<!-- ddadmin:start -->';
export const REGION_END = '<!-- ddadmin:end -->';
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

/* ---------------- templates ---------------- */
const templateOk = (h) => !!h && ['<title', '</head>', '<main', '</main>'].every((t) => h.includes(t));

export function loadTemplate(type) {
  const s = settings();
  const rel = String(type === 'blog' ? s.blog_template : s.product_template).replace(/^\/+/, '');
  const cache = path.join(DATA_DIR, `tpl_${type}.html`);
  const abs = path.join(SITE_DIR, rel);
  let html = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
  if (templateOk(html) && !html.includes(MANAGED_MARK)) {
    try { if (!fs.existsSync(cache) || fs.readFileSync(cache, 'utf8') !== html) fs.writeFileSync(cache, html); } catch {}
    return html;
  }
  if (fs.existsSync(cache)) {
    html = fs.readFileSync(cache, 'utf8');
    if (templateOk(html)) return html;
  }
  throw new Error(`Template page nahi mila (${rel}). Settings me ek existing ${type} page ka path dein.`);
}

export const templateDepthOk = (rel) => rel.replace(/^\/+|\/+$/g, '').split('/').length === 3;

function assemble(tpl, head, main) {
  const titlePos = tpl.indexOf('<title');
  const headEnd = tpl.indexOf('</head>');
  const mainStart = tpl.indexOf('<main');
  const mainEnd = tpl.indexOf('</main>') + 7;
  return tpl.slice(0, titlePos) + head + '\n' + tpl.slice(headEnd, mainStart) + main + tpl.slice(mainEnd);
}

/* ---------------- head + styles ---------------- */
export const absUrl = (p = '') => settings().site_url.replace(/\/+$/, '') + '/' + String(p).replace(/^\/+/, '');
const imgAbs = (rel) => (!rel ? absUrl('og-image.jpg') : /^https?:\/\//.test(rel) ? rel : absUrl(rel));
const assetSrc = (rel, pre) => (!rel ? '' : /^https?:\/\//.test(rel) ? rel : pre + rel.replace(/^\/+/, ''));
const ld = (o) => '    <script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>\n';

function headHtml(m) {
  const s = settings();
  const t = esc(m.title), d = esc(m.desc), u = esc(m.url), i = esc(m.image);
  const robots = m.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1';
  let h = `<title>${t}</title>
    <meta name="description" content="${d}"/>
    <meta name="robots" content="${robots}"/>
    <link rel="canonical" href="${u}"/>
    <meta property="og:type" content="${esc(m.ogType || 'website')}"/>
    <meta property="og:site_name" content="${esc(s.site_name)}"/>
    <meta property="og:locale" content="en_IN"/>
    <meta property="og:title" content="${t}"/>
    <meta property="og:description" content="${d}"/>
    <meta property="og:url" content="${u}"/>
    <meta property="og:image" content="${i}"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="${t}"/>
    <meta name="twitter:description" content="${d}"/>
    <meta name="twitter:image" content="${i}"/>
`;
  if (m.published) h += `    <meta property="article:published_time" content="${esc(m.published)}"/>\n`;
  h += `    <link rel="stylesheet" href="../../assets/style.css" />\n    <style>${EXTRA_CSS}</style>\n`;
  for (const o of m.jsonld || []) h += ld(o);
  return h;
}

const EXTRA_CSS = [
  '.dd-prose{font-size:1.0625rem;line-height:1.8;color:#1f2937}',
  '.dd-prose h2{font-size:1.5rem;line-height:2rem;font-weight:600;margin:2.5rem 0 1rem;color:#121a33}',
  '.dd-prose h3{font-size:1.2rem;font-weight:600;margin:2rem 0 .75rem;color:#121a33}',
  '.dd-prose h4{font-weight:600;margin:1.5rem 0 .5rem}',
  '.dd-prose p{margin:0 0 1rem}.dd-prose p:empty{display:none}',
  '.dd-prose ul{list-style:disc;padding-left:1.5rem;margin:0 0 1.5rem}',
  '.dd-prose ol{list-style:decimal;padding-left:1.5rem;margin:0 0 1.5rem}',
  '.dd-prose li{margin:.3rem 0}.dd-prose strong{font-weight:600;color:#121a33}',
  '.dd-prose a{color:#2563eb}.dd-prose a:hover{text-decoration:underline}',
  '.dd-prose img{max-width:100%;height:auto;border-radius:12px;margin:1.5rem auto}',
  '.dd-prose blockquote{border-left:4px solid #d7141c;background:#f5f7fb;padding:1rem 1.25rem;margin:1.5rem 0;border-radius:0 12px 12px 0;color:#374151}',
  '.dd-prose pre{background:#0b1f4d;color:#e5e7eb;padding:1rem;border-radius:12px;overflow:auto;margin:1.5rem 0;font-size:.875rem;white-space:pre-wrap}',
  '.dd-prose code{background:#f3f4f6;padding:.1rem .35rem;border-radius:4px;font-size:.9em}.dd-prose pre code{background:none;padding:0}',
  '.dd-prose table{width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:.95rem}',
  '.dd-prose th,.dd-prose td{border:1px solid #dce2ee;padding:.6rem .75rem;text-align:left}.dd-prose th{background:#f5f7fb}',
  '.dd-prose hr{border:0;border-top:1px solid #dce2ee;margin:2rem 0}',
  '.dd-prose iframe{width:100%;aspect-ratio:16/9;height:auto;border-radius:12px;margin:1.5rem 0}',
  '.dd-prose .ql-align-center{text-align:center}.dd-prose .ql-align-right{text-align:right}.dd-prose .ql-align-justify{text-align:justify}',
  '.dd-prose .ql-indent-1{padding-left:2em}.dd-prose .ql-indent-2{padding-left:4em}.dd-prose .ql-video{width:100%;aspect-ratio:16/9;height:auto}',
  '.dd-chip{display:inline-block;border:1px solid #dce2ee;border-radius:999px;padding:.25rem .75rem;font-size:.8rem;color:#4a5578;margin:0 .4rem .4rem 0}',
  '.dd-faq details{border:1px solid #dce2ee;border-radius:14px;padding:1rem 1.25rem;margin-bottom:.75rem;background:#fff}',
  '.dd-faq summary{cursor:pointer;font-weight:600;color:#121a33;list-style:none}.dd-faq summary::-webkit-details-marker{display:none}',
  '.dd-faq summary:after{content:"+";float:right;color:#d7141c;font-weight:700}.dd-faq details[open] summary:after{content:"\\2212"}',
  '.dd-faq details p{margin-top:.6rem;color:#4a5578;line-height:1.7}',
  '.dd-cover{width:100%;max-height:440px;object-fit:cover;border-radius:16px;margin-bottom:2rem}',
  '.dd-card-img{width:100%;height:100%;object-fit:cover}',
  '.dd-rel{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}',
  '.dd-rel a{display:block;border:1px solid #dce2ee;border-radius:14px;padding:1rem 1.1rem;background:#fff;transition:border-color .2s}',
  '.dd-rel a:hover{border-color:rgba(215,20,28,.4)}.dd-rel small{color:#d7141c;font-weight:600;font-size:.75rem}',
  '.dd-rel strong{display:block;margin-top:.25rem;color:#121a33;font-weight:600;line-height:1.4}',
  '.dd-price{display:inline-block;margin-top:1.25rem;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:.5rem .9rem;color:#fff}',
].join('');

/** Editor content uses root paths (/assets/uploads/..); make them relative to the page depth. */
const relativize = (html, pre) => String(html || '').replace(/(src|href)="\/assets\//g, `$1="${pre}assets/`);

/* ---------------- icons (lucide, same as the site) ---------------- */
const PATHS = {
  check: '<path d="M20 6 9 17l-5-5"></path>',
  arrow: '<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>',
  bot: '<path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path>',
  msg: '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path>',
  play: '<path d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z"></path><circle cx="12" cy="12" r="10"></circle>',
};
const icon = (n, cls) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${PATHS[n] || ''}</svg>`;

/* ---------------- original (static) items on the listing pages ---------------- */
const NAMED_ENT = { middot: '\u00b7', nbsp: ' ', ndash: '\u2013', mdash: '\u2014', rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201d', ldquo: '\u201c', hellip: '\u2026', bull: '\u2022', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (s) =>
  String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (m, d, x, n) => {
      if (d || x) { try { return String.fromCodePoint(d ? Number(d) : parseInt(x, 16)); } catch { return m; } }
      return NAMED_ENT[n.toLowerCase()] ?? m;
    })
    .trim();

function stripRegion(html) {
  const a = html.indexOf(REGION_START), b = html.indexOf(REGION_END);
  return a !== -1 && b > a ? html.slice(0, a) + html.slice(b + REGION_END.length) : html;
}

export function staticBlogs() {
  const f = path.join(SITE_DIR, 'blog/index.html');
  if (!fs.existsSync(f)) return [];
  const html = stripRegion(fs.readFileSync(f, 'utf8'));
  const out = [];
  for (const m of html.matchAll(/<a class="w-full sm:w-\[calc[^"]*" href="\.\.\/blog\/([a-z0-9-]+)">([\s\S]*?)<\/a>/g)) {
    const card = m[2];
    const date = (card.match(/<span class="text-xs text-muted-foreground">([A-Z][a-z]{2} \d{1,2}, \d{4})<\/span>/) || [])[1];
    const d = date ? new Date(date + ' 12:00') : null;
    out.push({
      slug: m[1],
      title: decode((card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [])[1] || m[1]),
      category: decode((card.match(/<span class="rounded-full[^"]*">([\s\S]*?)<\/span>/) || [])[1]),
      date: d && !isNaN(d) ? d.toISOString().slice(0, 10) : '',
    });
  }
  return out;
}

export function staticProducts() {
  const f = path.join(SITE_DIR, 'products/index.html');
  if (!fs.existsSync(f)) return [];
  const html = stripRegion(fs.readFileSync(f, 'utf8'));
  const out = [];
  for (const m of html.matchAll(/<article class="group flex h-full flex-col[^"]*">([\s\S]*?)<\/article>/g)) {
    const c = m[1];
    const href = (c.match(/href="([^"]+)"/) || [])[1] || '';
    out.push({
      href,
      slug: href.split('/').pop(),
      image: ((c.match(/<img src="([^"]+)"/) || [])[1] || '').replace(/^\.\.\//, ''),
      name: decode((c.match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [])[1]),
      category: decode((c.match(/<span class="absolute left-3[^"]*">([\s\S]*?)<\/span>/) || [])[1]),
      audience: decode((c.match(/<h3[^>]*>[\s\S]*?<\/h3><p[^>]*>([\s\S]*?)<\/p>/) || [])[1]),
    });
  }
  return out;
}

export function slugTakenBySite(type, slug) {
  const f = pagePath(type, slug);
  return fs.existsSync(f) && !fs.readFileSync(f, 'utf8').includes(MANAGED_MARK);
}

/* ---------------- sorting ---------------- */
export const published = (list) => list.filter((i) => i.status === 'published');
export const sortedBlogs = (list) =>
  [...list].sort((a, b) => (+!!b.featured - +!!a.featured) || String(b.date || '').localeCompare(String(a.date || '')));
export const sortedProducts = (list) =>
  [...list].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0) || String(a.created_at).localeCompare(String(b.created_at)));
const faqsOf = (x) => (x.faqs || []).filter((f) => String(f.q || '').trim() && String(f.a || '').trim());
const nl2br = (s) => esc(s).replace(/\r?\n/g, '<br>');
const faqLd = (faqs) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

/* ---------------- blog ---------------- */
export function renderBlogPage(p, allPublished, preview = false) {
  const s = settings();
  const tpl = loadTemplate('blog');
  const pre = '../../';
  const url = absUrl('blog/' + p.slug);
  const title = p.seo_title || `${p.title} | ${s.site_name}`;
  const desc = p.seo_desc || p.excerpt || '';
  const minutes = readMinutes((p.content || '') + ' ' + (p.quick_answer || ''));
  const author = p.author || s.default_author;
  const date = p.date || today();
  const image = imgAbs(p.cover);
  const faqs = faqsOf(p);

  const jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: desc,
      mainEntityOfPage: url, image, datePublished: date, dateModified: String(p.updated_at || nowIso()).slice(0, 10),
      author: author === s.default_author ? { '@type': 'Organization', name: author, url: absUrl() } : { '@type': 'Person', name: author },
      publisher: { '@id': absUrl('#organization') }, keywords: (p.tags || []).join(', '),
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absUrl() },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: absUrl('blog') },
        { '@type': 'ListItem', position: 3, name: p.title, item: url },
      ],
    },
  ];
  if (faqs.length) jsonld.push(faqLd(faqs));

  const head = headHtml({ title, desc, url, image, ogType: 'article', noindex: p.noindex || preview, jsonld, published: date });

  let m = `<main class="flex-1">${MANAGED_MARK}<article class="max-w-3xl mx-auto px-4 py-12 text-gray-800">`;
  m += `<nav class="mb-4 text-sm text-gray-500"><a class="hover:underline" href="${pre}blog">Blog</a>${p.category ? ` / <span>${esc(p.category)}</span>` : ''}</nav>`;
  m += `<h1 class="text-3xl md:text-4xl font-bold mb-6 leading-tight">${esc(p.title)}</h1>`;
  m += `<p class="text-sm text-gray-500 mb-6">By ${esc(author)} · ${esc(niceDate(date))} · ${minutes} min read</p>`;
  if (p.cover) m += `<img class="dd-cover" src="${esc(assetSrc(p.cover, pre))}" alt="${esc(p.cover_alt || p.title)}"/>`;
  if (String(p.quick_answer || '').trim()) {
    m += `<div class="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5"><p class="font-semibold mb-2">Quick answer</p><p>${nl2br(p.quick_answer)}</p></div>`;
  }
  m += `<div class="dd-prose">${relativize(p.content, pre)}</div>`;
  if (faqs.length) {
    m += '<h2 class="text-2xl font-semibold mt-10 mb-4">Frequently Asked Questions</h2><div class="mb-8 space-y-4">';
    for (const f of faqs) m += `<div><h3 class="font-semibold">${esc(f.q)}</h3><p class="mt-1">${nl2br(f.a)}</p></div>`;
    m += '</div>';
  }
  if ((p.tags || []).length) m += '<div class="mt-10">' + p.tags.map((t) => `<span class="dd-chip">#${esc(t)}</span>`).join('') + '</div>';

  const pool = [];
  for (const o of sortedBlogs(allPublished)) if (o.id !== p.id) pool.push({ slug: o.slug, title: o.title, category: o.category || '', same: o.category === p.category });
  for (const o of staticBlogs()) if (o.slug !== p.slug) pool.push({ ...o, same: o.category === p.category });
  pool.sort((a, b) => +b.same - +a.same);
  const rel = pool.slice(0, 3);
  if (rel.length) {
    m += '<h2 class="text-2xl font-semibold mt-12 mb-4">Keep reading</h2><div class="dd-rel">';
    for (const r of rel) m += `<a href="${pre}blog/${esc(r.slug)}"><small>${esc(r.category || 'Blog')}</small><strong>${esc(r.title)}</strong></a>`;
    m += '</div>';
  }
  m += `<div class="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-6"><p class="font-semibold text-lg">Have a project in mind?</p>`
    + `<p class="mt-1 text-gray-500">Talk to our team for a free consultation and a written proposal.</p>`
    + `<a class="inline-flex items-center gap-2 mt-4 rounded-xl bg-dd-red px-5 py-3 font-semibold text-white transition hover:bg-dd-redink" href="${pre}contact">Get free consultation ${icon('arrow', 'w-4 h-4')}</a></div>`;
  m += '</article></main>';
  return assemble(tpl, head, m);
}

function blogCard(p) {
  const pre = '../';
  const minutes = readMinutes((p.content || '') + ' ' + (p.quick_answer || ''));
  const visual = p.cover
    ? `<div class="h-40 bg-red-50 overflow-hidden"><img src="${esc(assetSrc(p.cover, pre))}" alt="${esc(p.cover_alt || p.title)}" loading="lazy" class="dd-card-img"/></div>`
    : `<div class="h-40 bg-red-50 flex items-center justify-center"><span class="text-6xl">${esc(p.emoji || '📝')}</span></div>`;
  return `<a class="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]" href="../blog/${esc(p.slug)}">`
    + '<article class="group rounded-2xl border border-border bg-white overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer h-full">'
    + visual + '<div class="p-6"><div class="flex items-center gap-2 mb-3">'
    + (p.category ? `<span class="rounded-full bg-red-50 text-red-700 text-xs font-semibold px-3 py-1">${esc(p.category)}</span>` : '')
    + `<span class="text-xs text-muted-foreground">${esc(niceDate(p.date))}</span>`
    + `<span class="text-xs text-muted-foreground">· ${minutes} min read</span></div>`
    + `<h3 class="font-bold group-hover:text-red-700 transition-colors">${esc(p.title)}</h3>`
    + `<p class="mt-2 text-sm text-muted-foreground line-clamp-2">${esc(p.excerpt || '')}</p>`
    + '</div></article></a>';
}

/* ---------------- product ---------------- */
const waLink = (name) => {
  const s = settings();
  const msg = `Hi ${s.site_name}, I'm interested in ${name}. Please share the setup options, inclusions and a tailored quote.`;
  return `https://wa.me/${String(s.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
};
const ctaHref = (link, pre) => {
  link = String(link || '').trim();
  if (!link) return pre + 'contact';
  if (/^(https?:|mailto:|tel:|#)/.test(link)) return link;
  return pre + link.replace(/^\/+/, '');
};

export function renderProductPage(p, allPublished, preview = false) {
  const s = settings();
  const tpl = loadTemplate('product');
  const pre = '../../';
  const url = absUrl('products/' + p.slug);
  const title = p.seo_title || `${p.name} | ${s.site_name}`;
  const desc = p.seo_desc || p.summary || '';
  const image = imgAbs(p.image);
  const faqs = faqsOf(p);

  const prodLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: desc, image, url,
    category: p.category || '', brand: { '@type': 'Brand', name: s.site_name },
  };
  if (p.price_value !== '' && p.price_value != null && !isNaN(Number(p.price_value))) {
    prodLd.offers = { '@type': 'Offer', price: String(p.price_value), priceCurrency: p.currency || 'INR', availability: 'https://schema.org/InStock', url };
  }
  const jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absUrl() },
        { '@type': 'ListItem', position: 2, name: 'Products', item: absUrl('products') },
        { '@type': 'ListItem', position: 3, name: p.name, item: url },
      ],
    },
    prodLd,
  ];
  if (faqs.length) jsonld.push(faqLd(faqs));
  const head = headHtml({ title, desc, url, image, noindex: p.noindex || preview, jsonld });

  let m = `<main class="flex-1">${MANAGED_MARK}`;
  m += '<section class="px-6 py-16 text-white bg-dd-navy md:px-12 md:py-24"><div class="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2"><div>';
  m += `<nav class="mb-5 text-[14px] text-white/60"><a class="hover:text-white" href="${pre}products">Products</a> / ${esc(p.name)}</nav>`;
  m += `<h1 class="text-4xl font-semibold leading-tight font-brand md:text-5xl">${esc(p.headline || p.name)}</h1>`;
  const sub = p.subheadline || p.summary || '';
  if (sub) m += `<p class="max-w-xl mt-5 text-lg text-white/70">${esc(sub)}</p>`;
  if (p.price) m += `<p class="dd-price">${esc(p.price)}</p>`;
  m += '<div class="flex flex-wrap gap-3 mt-8">';
  m += `<a class="inline-flex items-center gap-2 rounded-xl bg-dd-red px-6 py-3.5 font-semibold text-white transition hover:bg-dd-redink" href="${esc(ctaHref(p.cta_link, pre))}">${esc(p.cta_label || 'Get ' + p.name)}${icon('arrow', 'lucide lucide-arrow-right w-4 h-4')}</a>`;
  m += `<a class="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 font-semibold text-white transition hover:border-white/60 hover:bg-white/10" href="${esc(waLink(p.name))}" target="_blank" rel="noopener">${icon('msg', 'lucide lucide-message-circle w-4 h-4')} WhatsApp us</a>`;
  m += `<a class="rounded-xl px-6 py-3.5 font-semibold ring-1 ring-white/30 hover:bg-white/10" href="${pre}contact">Talk to us</a>`;
  m += '</div></div>';
  if (p.image) m += `<img src="${esc(assetSrc(p.image, pre))}" alt="${esc(p.image_alt || p.name)}" class="object-cover w-full h-72 rounded-2xl ring-1 ring-white/15 md:h-96"/>`;
  m += '</div></section>';

  const features = p.features || [], who = p.who || [], steps = p.steps || [];
  if (p.problem || who.length || features.length || steps.length) {
    m += '<section class="px-6 py-16 bg-white md:px-12"><div class="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-2"><div>';
    let first = true;
    if (p.problem) {
      m += `<h2 class="text-2xl font-semibold text-dd-ink">The problem</h2><p class="mt-3 text-lg text-dd-slate">${nl2br(p.problem)}</p>`;
      first = false;
    }
    if (who.length) {
      m += `<h2 class="${first ? '' : 'mt-10 '}text-2xl font-semibold text-dd-ink">Who needs it</h2><div class="flex flex-wrap gap-2 mt-4">`;
      m += who.map((w) => `<span class="rounded-full border border-dd-line px-4 py-2 text-[14px] font-medium text-dd-ink">${esc(w)}</span>`).join('');
      m += '</div>';
      first = false;
    }
    if (features.length) {
      m += `<h2 class="${first ? '' : 'mt-10 '}text-2xl font-semibold text-dd-ink">What you get</h2><ul class="grid gap-3 mt-4">`;
      m += features.map((f) => `<li class="flex items-center gap-3 text-dd-ink">${icon('check', 'lucide lucide-check w-5 h-5 text-dd-red')}${esc(f)}</li>`).join('');
      m += '</ul>';
    }
    m += '</div>';
    if (steps.length) {
      m += '<div class="p-8 rounded-2xl bg-dd-paper"><h2 class="text-2xl font-semibold text-dd-ink">How it works</h2><ol class="grid gap-5 mt-6">';
      m += steps.map((st, i) => `<li class="flex items-start gap-4"><span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-dd-ink text-[14px] font-semibold text-white">${i + 1}</span><span class="pt-1 text-dd-ink">${esc(st)}</span></li>`).join('');
      m += '</ol></div>';
    }
    m += '</div></section>';
  }
  if (String(p.details || '').replace(/<(?!img|iframe)[^>]+>/g, '').trim()) {
    m += `<section class="px-6 py-16 border-t border-dd-line bg-white md:px-12"><div class="mx-auto max-w-3xl"><div class="dd-prose">${relativize(p.details, pre)}</div></div></section>`;
  }
  if (faqs.length) {
    m += '<section class="px-6 py-16 border-t border-dd-line bg-white md:px-12"><div class="mx-auto max-w-3xl"><h2 class="text-2xl font-semibold text-dd-ink">Frequently asked questions</h2><div class="mt-6 dd-faq">';
    m += faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${nl2br(f.a)}</p></details>`).join('');
    m += '</div></div></section>';
  }
  const more = [];
  for (const o of sortedProducts(allPublished)) {
    if (o.id === p.id || !o.show_in_listing) continue;
    more.push({ href: pre + 'products/' + o.slug, image: assetSrc(o.image, pre), name: o.name, category: o.category || '' });
  }
  for (const o of staticProducts()) {
    if (o.slug === p.slug) continue;
    more.push({ href: o.href.startsWith('../') ? '../' + o.href : o.href, image: o.image ? pre + o.image : '', name: o.name, category: o.category });
  }
  if (more.length) {
    m += '<section class="px-6 border-t border-dd-line bg-dd-paper py-14 md:px-12"><div class="mx-auto max-w-[1200px]"><h2 class="text-xl font-semibold text-dd-ink">More AI products</h2><div class="grid gap-4 mt-5 md:grid-cols-3">';
    for (const o of more.slice(0, 3)) {
      m += `<a class="flex items-center gap-4 p-3 bg-white border rounded-xl border-dd-line hover:border-dd-red/40" href="${esc(o.href)}">`
        + (o.image ? `<img src="${esc(o.image)}" alt="" loading="lazy" class="object-contain w-20 h-16 rounded-lg"/>` : '')
        + `<div><p class="font-semibold text-dd-ink">${esc(o.name)}</p><p class="text-[13px] text-dd-slate">${esc(o.category)}</p></div></a>`;
    }
    m += '</div></div></section>';
  }
  m += '</main>';
  return assemble(tpl, head, m);
}

function productCard(p) {
  const pre = '../';
  const href = '../products/' + esc(p.slug);
  const img = p.image
    ? `<img src="${esc(assetSrc(p.image, pre))}" alt="${esc(p.image_alt || p.name)}" loading="lazy" class="object-contain w-full h-full transition duration-500 group-hover:scale-105"/>`
    : `<span class="grid w-full h-full place-items-center text-dd-red">${icon('bot', 'w-12 h-12')}</span>`;
  let h = '<article class="group flex h-full flex-col overflow-hidden rounded-2xl border border-dd-line bg-white transition duration-300 hover:-translate-y-1 hover:border-dd-red/40 hover:shadow-[0_20px_50px_rgba(17,26,51,.10)]">';
  h += `<a class="relative block overflow-hidden h-44 bg-dd-paper" href="${href}">${img}`;
  if (p.category) h += `<span class="absolute left-3 top-3 rounded-full border border-white/60 bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-dd-ink backdrop-blur">${esc(p.category)}</span>`;
  h += `</a><div class="flex flex-col flex-1 p-5"><div class="flex items-start gap-3"><span class="grid w-10 h-10 shrink-0 place-items-center rounded-xl bg-red-50 text-dd-red">${icon('bot', 'lucide lucide-bot w-5 h-5')}</span>`;
  h += `<div><h3 class="text-xl font-semibold font-brand text-dd-ink">${esc(p.name)}</h3>`;
  if (p.audience) h += `<p class="mt-1 text-xs leading-5 text-dd-slate">${esc(p.audience)}</p>`;
  h += `</div></div><p class="flex-1 mt-4 text-sm leading-6 text-dd-slate">${esc(p.summary || '')}</p>`;
  const feat = (p.features || []).slice(0, 3);
  if (feat.length) {
    h += '<ul class="mt-4 space-y-2">' + feat.map((f) => `<li class="flex items-start gap-2 text-xs leading-5 text-dd-ink/80">${icon('check', 'lucide lucide-check mt-0.5 h-3.5 w-3.5 shrink-0 text-dd-red')}${esc(f)}</li>`).join('') + '</ul>';
  }
  h += `<div class="grid gap-2 mt-5"><a href="${href}" class="inline-flex items-center justify-center gap-2 rounded-xl border border-dd-line px-3 py-2.5 text-sm font-semibold text-dd-ink transition hover:border-dd-ink/30 hover:bg-dd-paper">${icon('play', 'lucide lucide-circle-play w-4 h-4')} View product</a>`;
  h += `<a href="${esc(waLink(p.name))}" target="_blank" rel="noreferrer" class="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition rounded-xl bg-dd-red hover:bg-dd-redink">Get a tailored quote ${icon('arrow', 'lucide lucide-arrow-right w-4 h-4')}</a></div>`;
  h += `<a class="inline-flex items-center justify-center gap-1 mt-4 text-xs font-semibold text-dd-slate hover:text-dd-red" href="${href}">Product details ${icon('arrow', 'lucide lucide-arrow-right h-3.5 w-3.5')}</a>`;
  return h + '</div></article>';
}

/* ---------------- writing pages + patching listings ---------------- */
export const pagePath = (type, slug) => path.join(SITE_DIR, type === 'blog' ? 'blog' : 'products', slug, 'index.html');

function writePage(type, slug, html) {
  if (!SLUG_RE.test(slug)) throw new Error('Slug galat hai.');
  if (slugTakenBySite(type, slug)) throw new Error(`Slug "${slug}" pe website ka original page already hai. Doosra slug rakhein.`);
  atomicWrite(pagePath(type, slug), html);
}

export function removePage(type, slug) {
  if (!SLUG_RE.test(slug || '')) return;
  const f = pagePath(type, slug);
  if (!fs.existsSync(f)) return;
  if (!fs.readFileSync(f, 'utf8').includes(MANAGED_MARK)) return; // never delete original pages
  fs.unlinkSync(f);
  try { fs.rmdirSync(path.dirname(f)); } catch {}
}

function matchingDivEnd(html, open) {
  let depth = 0, pos = open;
  while (pos < html.length) {
    const o = html.indexOf('<div', pos), c = html.indexOf('</div>', pos);
    if (c === -1) return -1;
    if (o !== -1 && o < c) { depth++; pos = o + 4; }
    else { depth--; if (depth === 0) return c; pos = c + 6; }
  }
  return -1;
}

// If the website has no blog/ or products/ listing page yet, build one from the site's own page template.
function createListingPage(relFile, gridOpen) {
  const type = relFile.startsWith('blog/') ? 'blog' : 'product';
  let tpl;
  try { tpl = loadTemplate(type); } catch { throw new Error(`${relFile} nahi mila aur template bhi nahi mila. Settings me ek existing ${type} page ka path dein.`); }
  const s = settings();
  const name = type === 'blog' ? 'Blog' : 'Products';
  const url = absUrl(relFile.replace(/index\.html$/, '').replace(/\/$/, ''));
  const head = `<title>${esc(name)} | ${esc(s.site_name)}</title>\n    <meta name="description" content="${esc(name)} by ${esc(s.site_name)}"/>\n    <link rel="canonical" href="${esc(url)}"/>\n`;
  const main = `<main><section class="max-w-6xl mx-auto px-4 py-16"><h1 class="text-3xl md:text-4xl font-bold mb-8 text-center">${esc(name)}</h1>${gridOpen}</div></section></main>`;
  const page = assemble(tpl, head, main).replace(/(href|src)="\.\.\/\.\.\//g, '$1="/');
  atomicWrite(path.join(SITE_DIR, relFile), page);
}

function patchRegion(relFile, gridOpen, inner, atEnd) {
  const abs = path.join(SITE_DIR, relFile);
  if (!fs.existsSync(abs)) createListingPage(relFile, gridOpen);
  const html = fs.readFileSync(abs, 'utf8');
  const a = html.indexOf(REGION_START), b = html.indexOf(REGION_END);
  let out;
  if (a !== -1 && b > a) {
    out = html.slice(0, a + REGION_START.length) + inner + html.slice(b);
  } else {
    const g = html.indexOf(gridOpen);
    if (g === -1) throw new Error(`${relFile} me listing grid nahi mila, isliye card add nahi hua (page fir bhi publish ho gaya).`);
    if (atEnd) {
      const end = matchingDivEnd(html, g);
      if (end === -1) throw new Error(`${relFile} ka grid structure samajh nahi aaya.`);
      out = html.slice(0, end) + REGION_START + inner + REGION_END + html.slice(end);
    } else {
      const ins = g + gridOpen.length;
      out = html.slice(0, ins) + REGION_START + inner + REGION_END + html.slice(ins);
    }
  }
  if (out !== html) {
    backupFile(relFile, 'before listing update');
    atomicWrite(abs, out);
  }
}

function rebuildBlogListing() {
  const cards = sortedBlogs(published(blogs())).map(blogCard).join('');
  patchRegion('blog/index.html', '<div class="flex flex-wrap justify-center gap-6">', cards, false);
}

function rebuildProductListing() {
  const cards = sortedProducts(published(products())).filter((p) => p.show_in_listing).map(productCard).join('');
  patchRegion('products/index.html', '<div class="grid gap-5 mt-8 md:grid-cols-2 xl:grid-cols-4">', cards, true);
}

function rebuildSitemap() {
  if (!settings().update_sitemap) return;
  const abs = path.join(SITE_DIR, 'sitemap.xml');
  if (!fs.existsSync(abs)) return;
  const xml = fs.readFileSync(abs, 'utf8');
  let inner = '\n';
  for (const p of published(blogs())) {
    if (p.noindex) continue;
    inner += `  <url><loc>${esc(absUrl('blog/' + p.slug))}</loc><lastmod>${String(p.updated_at || p.date).slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>`
      + (p.cover ? `<image:image><image:loc>${esc(imgAbs(p.cover))}</image:loc></image:image>` : '') + '</url>\n';
  }
  for (const p of published(products())) {
    if (p.noindex) continue;
    inner += `  <url><loc>${esc(absUrl('products/' + p.slug))}</loc><lastmod>${String(p.updated_at || nowIso()).slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority>`
      + (p.image ? `<image:image><image:loc>${esc(imgAbs(p.image))}</image:loc></image:image>` : '') + '</url>\n';
  }
  const a = xml.indexOf(REGION_START), b = xml.indexOf(REGION_END);
  let out;
  if (a !== -1 && b > a) out = xml.slice(0, a + REGION_START.length) + inner + xml.slice(b);
  else {
    const c = xml.lastIndexOf('</urlset>');
    if (c === -1) return;
    out = xml.slice(0, c) + REGION_START + inner + REGION_END + '\n' + xml.slice(c);
  }
  if (out !== xml) {
    backupFile('sitemap.xml', 'before sitemap update');
    atomicWrite(abs, out);
  }
}


/* ---------------- portfolio projects (cards on /portfolio) ---------------- */
export const PF_START = '<!-- ddadmin:projects:start -->';
export const PF_END = '<!-- ddadmin:projects:end -->';
const PF_FILE = 'portfolio/index.html';
const PH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>';

export const sortedProjects = (list) =>
  [...list].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0) || String(a.created_at).localeCompare(String(b.created_at)));

function projectCard(p) {
  const hasImg = !!p.image;
  const grad = p.color_from && p.color_to ? ` style="--pg-from:${esc(p.color_from)};--pg-to:${esc(p.color_to)}"` : '';
  const ph = hasImg && !grad ? '' : ' pg-ph';
  let h = `<article class="pg-card" id="project-${esc(p.slug)}"><div class="pg-media${ph}"${grad}>`;
  h += hasImg
    ? `<img src="${esc(assetSrc(p.image, '../'))}" alt="${esc(p.image_alt || p.title)}" loading="lazy" decoding="async"/>`
    : PH_SVG;
  if (p.category) h += `<span class="pg-tag">${esc(p.category)}</span>`;
  h += '</div><div class="pg-content">';
  if (p.client) h += `<p class="pg-client">${esc(p.client)}</p>`;
  h += `<h3 class="pg-title">${esc(p.title)}</h3>`;
  if (p.summary) h += `<p class="pg-desc">${esc(p.summary)}</p>`;
  if ((p.stats || []).length) {
    h += '<ul class="pg-stats">' + p.stats.map((x) => `<li><b>${esc(x.value)}</b>${x.label ? `<span>${esc(x.label)}</span>` : ''}</li>`).join('') + '</ul>';
  }
  if ((p.techs || []).length) h += '<ul class="pg-techs">' + p.techs.map((t) => `<li>${esc(t)}</li>`).join('') + '</ul>';

  if (p.subtitle || p.case_study || p.outcome || p.website) {
    let host = '';
    try { host = new URL(p.website).hostname.replace(/^www\./, ''); } catch { host = p.website || ''; }
    h += '<details class="pg-details"><summary><span class="pg-closed">Read case study</span><span class="pg-open">Close case study</span></summary><div class="pg-more">';
    if (p.subtitle) h += `<p class="pg-more-full pg-sub">${esc(p.subtitle)}</p>`;
    const meta = [];
    if (p.client) meta.push(['Client', esc(p.client)]);
    if (p.category) meta.push(['Category', esc(p.category)]);
    if (p.website) meta.push(['Website', `<a href="${esc(p.website)}" target="_blank" rel="noopener noreferrer">${esc(host)}</a>`]);
    if (meta.length) h += '<dl class="pg-more-full pg-meta">' + meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('') + '</dl>';
    if (p.case_study) h += `<div class="pg-more-full">${relativize(String(p.case_study).replace(/<(\/?)h[23]\b/gi, '<$1h4'), '../')}</div>`;
    if (p.outcome) h += `<div class="pg-more-full pg-result"><h4>Project Outcome</h4><p>${nl2br(p.outcome)}</p></div>`;
    h += '<div class="pg-more-full pg-actions"><a class="pg-btn" href="../contact">Discuss a similar project</a>';
    if (p.website) h += `<a class="pg-btn pg-btn-ghost" href="${esc(p.website)}" target="_blank" rel="noopener noreferrer">Visit website</a>`;
    h += '</div></div></details>';
  }
  return h + '</div></article>';
}

/** Put the admin-made project cards on /portfolio, just before the "And many more" card. */
export function rebuildPortfolioListing() {
  const abs = path.join(SITE_DIR, PF_FILE);
  if (!fs.existsSync(abs)) throw new Error('portfolio/index.html nahi mila, isliye projects website par nahi lage.');
  const html = fs.readFileSync(abs, 'utf8');
  const cards = sortedProjects(published(projects())).map(projectCard).join('\n');
  const block = PF_START + (cards ? '\n' + cards + '\n' : '') + PF_END;
  const a = html.indexOf(PF_START), b = html.indexOf(PF_END);
  let out;
  if (a !== -1 && b > a) {
    out = html.slice(0, a) + block + html.slice(b + PF_END.length);
  } else {
    if (!cards) return; // kuch add karne ko nahi, page ko chhedo mat
    const g = html.indexOf('id="project-grid"');
    if (g === -1) throw new Error('portfolio page me project grid (id="project-grid") nahi mila, isliye cards add nahi hue.');
    let at = html.indexOf('<!-- ---------- AND MANY MORE', g);
    if (at === -1) at = html.indexOf('<!-- ================ ADD NEW PROJECT CARDS ABOVE THIS LINE', g);
    if (at === -1) {
      const open = html.lastIndexOf('<div', g);
      at = matchingDivEnd(html, open);
      if (at === -1) throw new Error('portfolio grid ka structure samajh nahi aaya.');
    }
    out = html.slice(0, at) + block + '\n' + html.slice(at);
  }
  if (out !== html) {
    backupFile(PF_FILE, 'before portfolio update');
    atomicWrite(abs, out);
  }
}

/** The hand-written project cards already on the portfolio page (admin never edits these). */
export function staticProjects() {
  const f = path.join(SITE_DIR, PF_FILE);
  if (!fs.existsSync(f)) return [];
  let html = fs.readFileSync(f, 'utf8');
  const a = html.indexOf(PF_START), b = html.indexOf(PF_END);
  if (a !== -1 && b > a) html = html.slice(0, a) + html.slice(b + PF_END.length);
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  const out = [];
  for (const m of html.matchAll(/<article class="pg-card"[^>]*>([\s\S]*?)<\/article>/g)) {
    const c = m[1];
    const client = decode((c.match(/<p class="pg-client">([\s\S]*?)<\/p>/) || [])[1]);
    if (/^and many more$/i.test(client)) continue;
    out.push({
      title: decode((c.match(/<h3 class="pg-title">([\s\S]*?)<\/h3>/) || [])[1]),
      client,
      category: decode((c.match(/<span class="pg-tag">([\s\S]*?)<\/span>/) || [])[1]),
      image: ((c.match(/<img[^>]*?\ssrc="([^"]+)"/) || [])[1] || '').replace(/^(\.\.\/)+/, ''),
    });
  }
  return out;
}

/** Regenerate every admin page of a type + its listing + sitemap. Returns warnings. */
export function syncType(type) {
  const warn = [];
  if (type === 'project') {
    try { rebuildPortfolioListing(); } catch (e) { warn.push(e.message); }
    return warn;
  }
  const list = type === 'blog' ? blogs() : products();
  const pub = published(list);
  for (const it of list) {
    try {
      if (it.status === 'published') writePage(type, it.slug, type === 'blog' ? renderBlogPage(it, pub) : renderProductPage(it, pub));
      else removePage(type, it.slug);
    } catch (e) {
      warn.push(`${it.title || it.name}: ${e.message}`);
    }
  }
  try { type === 'blog' ? rebuildBlogListing() : rebuildProductListing(); } catch (e) { warn.push(e.message); }
  try { rebuildSitemap(); } catch (e) { warn.push('Sitemap: ' + e.message); }
  return warn;
}

/** Publish scheduled posts whose date has arrived. */
export function runScheduler() {
  const list = dbGet('blogs', []);
  let n = 0;
  for (const it of list) {
    if (it.status === 'scheduled' && (it.date || '9999') <= today()) {
      it.status = 'published';
      it.updated_at = nowIso();
      n++;
    }
  }
  if (n) {
    dbPut('blogs', list);
    syncType('blog');
    logActivity('scheduler', 'Scheduled publish', `${n} post(s)`);
  }
  return n;
}
