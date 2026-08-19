import { useState, type ReactNode } from 'react';
import { config as defaultConfig } from '../../lib/config';
import type { SiteConfig } from '../../lib/types';
import { applyTheme } from '../../lib/config';
import { isFsSupported, writeFile } from '../../lib/fs';

function Field({ label, value, onChange, type = 'text', placeholder = '', hint = '' }: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <input
        type={type}
        className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-surface focus:border-accent outline-none"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="text-xs text-muted/70 mt-1 block">{hint}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="text-base font-semibold text-text mb-3 pb-2 border-b border-black/5">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

export default function SettingsPanel() {
  // Deep clone so edits are local until saved.
  const [cfg, setCfg] = useState<SiteConfig>(() => JSON.parse(JSON.stringify(defaultConfig)));
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'info'; msg: string }>({ kind: 'idle', msg: '' });
  const supported = isFsSupported();

  const update = (path: string, value: unknown) => {
    setCfg((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as any;
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next as SiteConfig;
    });
  };

  const preview = () => applyTheme(cfg);

  const save = async () => {
    const json = JSON.stringify(cfg, null, 2);
    const ok = await writeFile('content/config.json', json);
    setStatus(
      ok
        ? { kind: 'ok', msg: '已保存到 content/config.json' }
        : { kind: 'info', msg: '浏览器不支持直接保存，已下载 config.json，请手动替换 content/config.json' }
    );
    preview();
    setTimeout(() => setStatus({ kind: 'idle', msg: '' }), 4000);
  };

  const uploadAndStore = async (path: string, kind: 'image' | 'audio') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = kind === 'image' ? 'image/*' : 'audio/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        // Save as data URL inline. Users who prefer files should put assets in public/.
        update(path, reader.result as string);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-text">个性化设置</h2>
        <div className="flex items-center gap-2">
          {status.msg && (
            <span className={`text-xs px-2 py-1 rounded ${status.kind === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
              {status.msg}
            </span>
          )}
          <button onClick={preview} className="px-3 py-1.5 rounded-lg text-sm border border-black/10 hover:bg-black/5">预览主题</button>
          <button onClick={save} className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:opacity-90">保存</button>
        </div>
      </div>

      {!supported && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-4">
          当前浏览器不支持 File System Access API，保存将以下载方式提供，请手动替换文件。推荐 Chrome / Edge。
        </p>
      )}

      <Section title="站点信息">
        <Field label="标题" value={cfg.site.title} onChange={(v) => update('site.title', v)} />
        <Field label="副标题" value={cfg.site.subtitle} onChange={(v) => update('site.subtitle', v)} />
        <Field label="描述" value={cfg.site.description} onChange={(v) => update('site.description', v)} />
        <Field label="作者" value={cfg.site.author} onChange={(v) => update('site.author', v)} />
        <Field label="站点 URL" value={cfg.site.url} onChange={(v) => update('site.url', v)} hint="用于分享链接拼接" />
        <Field label="语言" value={cfg.site.language} onChange={(v) => update('site.language', v)} />
      </Section>

      <Section title="主题配色">
        <Field label="主色（accent）" type="color" value={cfg.theme.accent} onChange={(v) => update('theme.accent', v)} />
        <Field label="背景色（background）" type="color" value={cfg.theme.background} onChange={(v) => update('theme.background', v)} />
        <Field label="卡片色（surface）" type="color" value={cfg.theme.surface} onChange={(v) => update('theme.surface', v)} />
        <Field label="正文色（text）" type="color" value={cfg.theme.text} onChange={(v) => update('theme.text', v)} />
        <Field label="辅助色（muted）" type="color" value={cfg.theme.muted} onChange={(v) => update('theme.muted', v)} />
        <label className="block">
          <span className="text-xs text-muted">字体</span>
          <select
            className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-surface"
            value={cfg.theme.fontFamily}
            onChange={(e) => update('theme.fontFamily', e.target.value)}
          >
            <option value="sans">无衬线 Sans</option>
            <option value="serif">衬线 Serif</option>
          </select>
        </label>
        <Field label="每页文章数" type="number" value={cfg.theme.postsPerPage} onChange={(v) => update('theme.postsPerPage', Number(v) || 6)} />
        <label className="block">
          <span className="text-xs text-muted">列表布局</span>
          <select
            className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-surface"
            value={cfg.theme.layout}
            onChange={(e) => update('theme.layout', e.target.value)}
          >
            <option value="list">列表 List</option>
            <option value="grid">网格 Grid</option>
          </select>
        </label>
      </Section>

      <Section title="个性化">
        <div className="sm:col-span-2">
          <span className="text-xs text-muted">头像</span>
          <div className="flex items-center gap-3">
            <img src={cfg.personalization.avatar} alt="" className="w-12 h-12 rounded-full object-cover ring-1 ring-black/10" />
            <input
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-black/10 bg-surface"
              value={cfg.personalization.avatar}
              onChange={(e) => update('personalization.avatar', e.target.value)}
              placeholder="/avatar.svg 或 URL"
            />
            <button onClick={() => uploadAndStore('personalization.avatar', 'image')} className="px-3 py-2 text-sm rounded-lg bg-black/5 hover:bg-black/10">上传</button>
          </div>
        </div>
        <div className="sm:col-span-2">
          <span className="text-xs text-muted">背景图（可空，留空则纯色背景；支持 JPG/PNG/WebP/SVG）</span>
          <div className="flex items-center gap-3">
            {cfg.personalization.background ? (
              <img
                src={cfg.personalization.background}
                alt=""
                className="w-16 h-12 rounded object-cover ring-1 ring-black/10 shrink-0"
              />
            ) : (
              <div className="w-16 h-12 rounded bg-black/5 ring-1 ring-black/10 shrink-0 flex items-center justify-center text-[10px] text-muted">无</div>
            )}
            <input
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-black/10 bg-surface"
              value={cfg.personalization.background}
              onChange={(e) => update('personalization.background', e.target.value)}
              placeholder="/background.jpg 或 URL"
            />
            <button
              onClick={() => uploadAndStore('personalization.background', 'image')}
              className="px-3 py-2 text-sm rounded-lg bg-black/5 hover:bg-black/10 shrink-0"
            >
              上传
            </button>
          </div>
          <span className="text-xs text-muted/70 mt-1 block">
            推荐做法：把图片放进项目 <code>public/</code> 目录，再在输入框填 <code>/your-file.jpg</code>。直接上传大图会以 base64 写入 config.json，文件会变大。
          </span>
        </div>
        <Field label="背景透明度" type="number" value={cfg.personalization.backgroundOpacity} onChange={(v) => update('personalization.backgroundOpacity', Number(v))} hint="0~1，建议 0.3~0.5" />
      </Section>

      <Section title="背景音乐">
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={cfg.personalization.music.enabled} onChange={(e) => update('personalization.music.enabled', e.target.checked)} />
          <span className="text-sm">启用背景音乐</span>
        </label>
        <Field label="音乐 URL" value={cfg.personalization.music.src} onChange={(v) => update('personalization.music.src', v)} placeholder="/music.mp3 或 URL" />
        <Field label="音乐标题" value={cfg.personalization.music.title} onChange={(v) => update('personalization.music.title', v)} />
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={cfg.personalization.music.autoplay} onChange={(e) => update('personalization.music.autoplay', e.target.checked)} />
          <span className="text-sm">自动播放（多数浏览器会被拦截）</span>
        </label>
      </Section>

      <Section title="社交链接">
        <Field label="GitHub" value={cfg.personalization.social.github} onChange={(v) => update('personalization.social.github', v)} />
        <Field label="Twitter / X" value={cfg.personalization.social.twitter} onChange={(v) => update('personalization.social.twitter', v)} />
        <Field label="邮箱" value={cfg.personalization.social.email} onChange={(v) => update('personalization.social.email', v)} />
        <Field label="页脚文字" value={cfg.personalization.footerText} onChange={(v) => update('personalization.footerText', v)} />
      </Section>

      <Section title="评论区（Giscus）">
        <p className="text-xs text-muted sm:col-span-2 -mt-1">
          Giscus 基于 GitHub Discussions 提供评论。请前往{' '}
          <a href="https://giscus.app/zh-CN" target="_blank" rel="noreferrer">giscus.app</a>{' '}
          配置仓库后，将生成的 repoId 与 categoryId 填入下方。
        </p>
        <label className="block">
          <span className="text-xs text-muted">评论提供方</span>
          <select
            className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-surface"
            value={cfg.comments.provider}
            onChange={(e) => update('comments.provider', e.target.value)}
          >
            <option value="giscus">Giscus</option>
            <option value="none">关闭</option>
          </select>
        </label>
        <Field label="仓库 (repo)" value={cfg.comments.giscus.repo} onChange={(v) => update('comments.giscus.repo', v)} placeholder="owner/repo" />
        <Field label="repoId" value={cfg.comments.giscus.repoId} onChange={(v) => update('comments.giscus.repoId', v)} />
        <Field label="分类 (category)" value={cfg.comments.giscus.category} onChange={(v) => update('comments.giscus.category', v)} />
        <Field label="categoryId" value={cfg.comments.giscus.categoryId} onChange={(v) => update('comments.giscus.categoryId', v)} />
        <label className="block">
          <span className="text-xs text-muted">映射方式</span>
          <select
            className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-surface"
            value={cfg.comments.giscus.mapping}
            onChange={(e) => update('comments.giscus.mapping', e.target.value)}
          >
            <option value="pathname">pathname</option>
            <option value="url">url</option>
            <option value="title">title</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted">主题</span>
          <select
            className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-surface"
            value={cfg.comments.giscus.theme}
            onChange={(e) => update('comments.giscus.theme', e.target.value)}
          >
            <option value="light">light</option>
            <option value="dark">dark</option>
            <option value="preferred_color_scheme">跟随系统</option>
          </select>
        </label>
      </Section>
    </div>
  );
}
