// Small fetch wrapper for the admin API.
const BASE = '/admin/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body, isForm) {
  const opts = { method, credentials: 'same-origin', headers: { 'X-Requested-With': 'fetch' } };
  if (body !== undefined) {
    if (isForm) opts.body = body;
    else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(BASE + path, opts);
  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    if (res.status === 401 && path !== '/login') window.dispatchEvent(new Event('dda:logout'));
    throw new ApiError((data && data.error) || `Server error (${res.status})`, res.status);
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b = {}) => request('POST', p, b),
  del: (p) => request('DELETE', p),
  upload: (files) => {
    const fd = new FormData();
    for (const f of files) fd.append('file', f);
    return request('POST', '/media', fd, true);
  },
};

export const siteUrl = (p) => (!p ? '' : /^https?:\/\//.test(p) ? p : '/' + String(p).replace(/^\/+/, ''));
