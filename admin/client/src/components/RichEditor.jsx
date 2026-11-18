import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { api } from '../api.js';
import { MediaModal, useNotice } from '../ui.jsx';

const TOOLBAR = [
  [{ header: [2, 3, 4, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  ['blockquote', 'code-block', 'link', 'image', 'video'],
  [{ align: [] }],
  ['clean'],
];

/**
 * Quill rich-text editor. `value` is only read on mount (and when `resetKey` changes);
 * after that the editor owns the content and reports changes through onChange(html, words).
 */
export default function RichEditor({ value, onChange, placeholder, resetKey, short }) {
  const host = useRef(null);
  const quill = useRef(null);
  const cb = useRef(onChange);
  const [picking, setPicking] = useState(false);
  const insertAt = useRef(0);
  const { toast } = useNotice();
  cb.current = onChange;

  useEffect(() => {
    const el = document.createElement('div');
    host.current.innerHTML = '';
    host.current.appendChild(el);
    const q = new Quill(el, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: {
          container: TOOLBAR,
          handlers: {
            image() {
              const r = q.getSelection(true);
              insertAt.current = r ? r.index : q.getLength();
              setPicking(true);
            },
          },
        },
      },
    });
    if (short) q.root.classList.add('short');
    q.clipboard.dangerouslyPasteHTML(value || '');
    q.history.clear();
    const emit = () => {
      const html = q.root.innerHTML === '<p><br></p>' ? '' : q.root.innerHTML;
      const words = (q.getText().trim().match(/\S+/g) || []).length;
      cb.current(html, words);
    };
    q.on('text-change', (d, o, source) => emit(source));
    // report initial word count without marking the form dirty
    const words = (q.getText().trim().match(/\S+/g) || []).length;
    cb.current(null, words);

    // paste / drop images -> upload instead of embedding base64
    const uploadAndInsert = (f) => {
      toast('Uploading image…');
      api.upload([f])
        .then((d) => {
          const r = q.getSelection(true);
          q.insertEmbed(r ? r.index : q.getLength(), 'image', d.files[0].url, 'user');
        })
        .catch((e) => toast(e.message));
    };
    const onDrop = (e) => {
      const f = e.dataTransfer?.files?.[0];
      if (f && /^image\//.test(f.type)) { e.preventDefault(); e.stopPropagation(); uploadAndInsert(f); }
    };
    const onPaste = (e) => {
      for (const it of e.clipboardData?.items || []) {
        if (it.kind === 'file' && /^image\//.test(it.type)) { e.preventDefault(); e.stopPropagation(); uploadAndInsert(it.getAsFile()); return; }
      }
    };
    q.root.addEventListener('drop', onDrop, true);
    q.root.addEventListener('paste', onPaste, true);
    quill.current = q;
    return () => {
      q.root.removeEventListener('drop', onDrop, true);
      q.root.removeEventListener('paste', onPaste, true);
      quill.current = null;
      if (host.current) host.current.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return (
    <div className="quill-wrap">
      <div ref={host} />
      {picking && (
        <MediaModal
          onClose={() => setPicking(false)}
          onPick={(m) => {
            setPicking(false);
            const q = quill.current;
            if (!q) return;
            q.insertEmbed(insertAt.current, 'image', m.url, 'user');
            q.setSelection(insertAt.current + 1);
          }}
        />
      )}
    </div>
  );
}
