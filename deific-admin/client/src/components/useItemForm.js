import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useNotice, useEditorGuards, slugify } from '../ui.jsx';

/** Load / edit / save one blog post or product. */
export default function useItemForm(kind, makeDefaults, toForm) {
  const { id } = useParams();
  const nav = useNavigate();
  const { notify, warnAll, clear } = useNotice();
  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const slugLocked = useRef(false);
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await api.get('/meta');
        const item = id ? await api.get(`/${kind}/${id}`) : null;
        if (!alive) return;
        setMeta(m);
        setForm(item ? toForm(item) : makeDefaults(m));
        slugLocked.current = !!item?.slug;
        setDirty(false);
        setLoadKey((k) => k + 1);
      } catch (e) {
        notify(e.message, 'error');
        nav('/' + kind);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, id]);

  const set = useCallback((k, v, { silent } = {}) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      const src = kind === 'products' ? 'name' : 'title';
      if (k === src && !slugLocked.current) next.slug = slugify(v);
      if (k === 'slug') slugLocked.current = !!v;
      return next;
    });
    if (!silent) setDirty(true);
  }, [kind]);

  const save = useCallback(async () => {
    const f = formRef.current;
    if (!f || saving) return;
    setSaving(true);
    clear();
    try {
      const r = await api.post('/' + kind, f);
      const it = r.item;
      const path = kind === 'blogs' ? 'blog' : 'products';
      notify(
        it.status === 'published' ? (kind === 'projects' ? `Live ho gaya! /portfolio par card lag gaya.` : `Live ho gaya! /${path}/${it.slug}`)
          : it.status === 'scheduled' ? `Scheduled: ${it.date} ko publish hoga.`
          : 'Draft save ho gaya.'
      );
      warnAll(r.warnings);
      setDirty(false);
      if (!id) {
        nav(`/${kind}/${it.id}`, { replace: true });
      } else {
        setForm((cur) => ({ ...cur, slug: it.slug, status: it.status, updated_at: it.updated_at }));
      }
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }, [kind, id, saving, notify, warnAll, clear, nav]);

  const remove = async () => {
    if (!window.confirm('Delete karein? Website se bhi hat jayega.')) return;
    try {
      const r = await api.del(`/${kind}/${id}`);
      setDirty(false);
      notify('Delete ho gaya.');
      warnAll(r.warnings);
      nav('/' + kind);
    } catch (e) { notify(e.message, 'error'); }
  };

  const duplicate = async () => {
    try {
      const r = await api.post(`/${kind}/${id}/duplicate`);
      notify('Copy ban gayi (draft).');
      nav(`/${kind}/${r.item.id}`);
    } catch (e) { notify(e.message, 'error'); }
  };

  useEditorGuards(dirty, save);
  return { id, isNew: !id, form, set, meta, dirty, saving, save, remove, duplicate, loadKey, setDirty };
}
