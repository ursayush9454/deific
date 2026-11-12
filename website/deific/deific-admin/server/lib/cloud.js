// Cloudinary image storage (optional).
// .env me CLOUDINARY_URL set ho to uploads Cloudinary par jaate hain, warna purana tarika (assets/uploads/ folder).
let v2 = null;
const folderName = () => (process.env.CLOUDINARY_FOLDER || 'deific').replace(/^\/+|\/+$/g, '');

export const cloudEnabled = () => !!process.env.CLOUDINARY_URL;

async function sdk() {
  if (v2) return v2;
  try {
    v2 = (await import('cloudinary')).v2;
  } catch {
    throw new Error('"cloudinary" package install nahi hai. Chalayein: npm install cloudinary');
  }
  v2.config({ secure: true }); // keys CLOUDINARY_URL se apne aap aa jaati hain
  return v2;
}

// f_auto = browser ke hisaab se best format (WebP/AVIF), q_auto = auto compression,
// w_1600,c_limit = 1600px se badi image chhoti ho jaati hai (chhoti ko badhata nahi)
const withTransform = (url, raw) => (raw ? url : url.replace('/upload/', '/upload/f_auto,q_auto,w_1600,c_limit/'));

/** Cloudinary URL -> public_id (e.g. "deific/2026/11/logo-abc"), warna null. */
export function cloudId(url) {
  const u = String(url || '');
  if (!/^https:\/\/res\.cloudinary\.com\//i.test(u)) return null;
  const i = u.indexOf('/upload/');
  if (i === -1) return null;
  let segs = u.slice(i + 8).split('?')[0].split('/');
  const v = segs.findIndex((s) => /^v\d+$/.test(s));
  if (v >= 0) segs = segs.slice(v + 1);
  const id = segs.join('/').replace(/\.[a-z0-9]+$/i, '');
  return id || null;
}

export async function cloudUpload(buffer, base, raw = false) {
  const c = await sdk();
  const d = new Date();
  const folder = `${folderName()}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  const public_id = `${base}-${Date.now().toString(36)}`;
  const r = await new Promise((resolve, reject) => {
    c.uploader.upload_stream({ folder, public_id, resource_type: 'image', overwrite: false }, (err, res) => (err ? reject(err) : resolve(res))).end(buffer);
  });
  return withTransform(r.secure_url, raw);
}

export async function cloudList() {
  const c = await sdk();
  const out = [];
  let cursor;
  do {
    const r = await c.api.resources({ type: 'upload', resource_type: 'image', prefix: folderName() + '/', max_results: 500, next_cursor: cursor });
    for (const x of r.resources || []) {
      const raw = x.format === 'svg' || x.format === 'gif';
      out.push({ path: withTransform(x.secure_url, raw), name: `${x.public_id.split('/').pop()}.${x.format}`, size: x.bytes || 0, mtime: Date.parse(x.created_at) || 0, cloud: true });
    }
    cursor = r.next_cursor;
  } while (cursor && out.length < 2000);
  return out;
}

export async function cloudDelete(id) {
  if (!id.startsWith(folderName() + '/')) throw new Error('Sirf admin se upload hui Cloudinary images delete ho sakti hain.');
  const c = await sdk();
  await c.uploader.destroy(id, { resource_type: 'image', invalidate: true });
}
