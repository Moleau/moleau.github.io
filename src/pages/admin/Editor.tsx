import { useEffect, useMemo, useRef, useState } from 'react';
import { getRawMarkdown, slugifyTitle } from '../../lib/posts';
import Markdown from '../../components/Markdown';
import { tools } from './markdownToolbar';
import { isFsSupported, readFile, writeFile } from '../../lib/fs';

interface Props {
  init: { slug?: string; fresh?: boolean };
}

interface FormState {
  slug: string;
  title: string;
  date: string;
  tags: string;
  excerpt: string;
  cover: string;
  body: string;
}

function parseRaw(raw: string): FormState {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const fm: Record<string, string> = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (kv) fm[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '');
    }
  }
  const body = m ? m[2] : raw;
  const slug = (fm.title ? slugifyTitle(fm.title) : '') || 'untitled';
  return {
    slug,
    title: fm.title || '',
    date: fm.date || new Date().toISOString().slice(0, 10),
    tags: (fm.tags || '').replace(/^\[|\]$/g, ''),
    excerpt: fm.excerpt || '',
    cover: fm.cover || '',
    body,
  };
}

function serialize(form: FormState): { slug: string; content: string } {
  const tags = form.tags
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t.slice(1) : t));
  const lines = [
    '---',
    `title: ${form.title || 'Untitled'}`,
    `date: ${form.date}`,
    tags.length ? `tags: [${tags.join(', ')}]` : 'tags: []',
    `cover: ${form.cover || '""'}`,
    form.excerpt ? `excerpt: ${JSON.stringify(form.excerpt)}` : 'excerpt: ""',
    '---',
    '',
    form.body,
  ];
  return { slug: form.slug || slugifyTitle(form.title), content: lines.join('\n') };
}

export default function Editor({ init }: Props) {
  const [form, setForm] = useState<FormState>(() => {
    if (init.slug) {
      const raw = getRawMarkdown(init.slug);
      if (raw) return parseRaw(raw);
    }
    return {
      slug: '',
      title: '',
      date: new Date().toISOString().slice(0, 10),
      tags: '',
      excerpt: '',
      cover: '',
      body: '# 新文章\n\n开始写作…\n',
    };
  });
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'err' | 'info'; msg: string }>({ kind: 'idle', msg: '' });
  const [loadedFromDisk, setLoadedFromDisk] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // If the slug exists on disk but not in build-time glob (e.g. just created),
  // try to load it from disk.
  useEffect(() => {
    if (!init.slug || loadedFromDisk) return;
    if (getRawMarkdown(init.slug)) return; // already loaded
    if (!isFsSupported()) return;
    readFile(`content/posts/${init.slug}.md`).then((raw) => {
      if (raw) {
        setForm(parseRaw(raw));
        setLoadedFromDisk(true);
      }
    });
  }, [init.slug, loadedFromDisk]);

  // Update slug automatically when title changes (only if slug empty or matches previous title slug).
  useEffect(() => {
    if (!form.slug || form.slug === slugifyTitle(form.title) || form.slug.startsWith('post-')) {
      setForm((f) => ({ ...f, slug: slugifyTitle(form.title) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  // Preview only the body — frontmatter is rendered via the form fields above.
  const previewSource = useMemo(() => form.body, [form.body]);

  const applyTool = (idx: number) => {
    const ta = taRef.current;
    if (!ta) return;
    const op = tools[idx].apply(form.body, ta.selectionStart, ta.selectionEnd);
    setForm((f) => ({ ...f, body: op.value }));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(op.selStart, op.selEnd);
    });
  };

  const save = async () => {
    const { slug, content } = serialize(form);
    const ok = await writeFile(`content/posts/${slug}.md`, content);
    setForm((f) => ({ ...f, slug }));
    setStatus(
      ok
        ? { kind: 'ok', msg: `已保存到 content/posts/${slug}.md` }
        : { kind: 'info', msg: `浏览器不支持直接保存，已下载 ${slug}.md，请手动放入 content/posts/ 目录。` }
    );
    setTimeout(() => setStatus({ kind: 'idle', msg: '' }), 5000);
  };

  const fieldClass = 'w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-surface focus:border-accent outline-none';

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-text">
          {init.fresh ? '新建文章' : '编辑文章'}
        </h2>
        <div className="flex items-center gap-2">
          {status.msg && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                status.kind === 'ok'
                  ? 'bg-emerald-50 text-emerald-700'
                  : status.kind === 'err'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-sky-50 text-sky-700'
              }`}
            >
              {status.msg}
            </span>
          )}
          <button onClick={save} className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:opacity-90">
            保存
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <label className="block">
          <span className="text-xs text-muted">标题</span>
          <input
            className={fieldClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="文章标题"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">slug（文件名）</span>
          <input
            className={fieldClass}
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">日期</span>
          <input
            type="date"
            className={fieldClass}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">标签（逗号分隔）</span>
          <input
            className={fieldClass}
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="教程, Markdown"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">封面图 URL（可空）</span>
          <input
            className={fieldClass}
            value={form.cover}
            onChange={(e) => setForm({ ...form, cover: e.target.value })}
            placeholder="https://…"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">摘要（可空）</span>
          <input
            className={fieldClass}
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
        </label>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 mb-2 p-1.5 rounded-lg bg-black/5 sticky top-16 z-10">
        {tools.map((t, i) => (
          <button
            key={t.label}
            title={t.title}
            onClick={() => applyTool(i)}
            className="min-w-[2rem] h-8 px-2 rounded text-sm font-medium bg-surface hover:bg-accent hover:text-white transition-colors"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <textarea
          ref={taRef}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="w-full min-h-[60vh] text-sm font-mono p-4 rounded-lg border border-black/10 bg-surface outline-none focus:border-accent resize-y"
          spellCheck={false}
        />
        <div className="min-h-[60vh] overflow-auto p-4 rounded-lg border border-black/10 bg-surface">
          <Markdown content={previewSource} />
        </div>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted">查看生成的 Markdown 源文件</summary>
        <pre className="mt-2 p-4 rounded-lg bg-black/5 text-xs overflow-auto max-h-80">{serialize(form).content}</pre>
      </details>
    </div>
  );
}
