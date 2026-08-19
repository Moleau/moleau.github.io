import { useState } from 'react';
import { config as defaultConfig } from '../../lib/config';
import type { SiteConfig } from '../../lib/types';
import { isFsSupported, writeFile } from '../../lib/fs';

export default function DeployPanel() {
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

  const save = async () => {
    const json = JSON.stringify(cfg, null, 2);
    const ok = await writeFile('content/config.json', json);
    setStatus(
      ok
        ? { kind: 'ok', msg: '部署配置已保存到 content/config.json' }
        : { kind: 'info', msg: '已下载 config.json，请手动替换 content/config.json' }
    );
    setTimeout(() => setStatus({ kind: 'idle', msg: '' }), 5000);
  };

  const repo = cfg.deploy.repository || 'your-username/blog';
  const base = repo.split('/')[1] || 'blog';
  const defaultPagesUrl = `https://${repo.split('/')[0]}.github.io/${base}`;
  const customDomain = cfg.deploy.domain;
  const sshRemote = `git@github.com:${repo}.git`;
  const httpsRemote = `https://github.com/${repo}.git`;

  const deployCmd = `npm run deploy`;

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => setStatus({ kind: 'ok', msg: '已复制到剪贴板' }),
      () => setStatus({ kind: 'info', msg: text })
    );
    setTimeout(() => setStatus({ kind: 'idle', msg: '' }), 3000);
  };

  const fieldClass = 'w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-surface focus:border-accent outline-none';

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-text">部署到 GitHub Pages</h2>
        <div className="flex items-center gap-2">
          {status.msg && (
            <span className={`text-xs px-2 py-1 rounded ${status.kind === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
              {status.msg}
            </span>
          )}
          <button onClick={save} className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:opacity-90">保存配置</button>
        </div>
      </div>

      <p className="text-sm text-muted mb-6">
        本工具通过本地 <code className="bg-black/5 px-1 rounded">npm run deploy</code> 脚本完成构建与推送，
        使用你本机的 Git 凭证（SSH 或 HTTPS），不向网页端暴露任何密钥。
      </p>

      <section className="grid sm:grid-cols-2 gap-3 mb-8">
        <label className="block sm:col-span-2">
          <span className="text-xs text-muted">GitHub 仓库（owner/repo）</span>
          <input className={fieldClass} value={cfg.deploy.repository} onChange={(e) => update('deploy.repository', e.target.value)} placeholder="your-username/blog" />
        </label>
        <label className="block">
          <span className="text-xs text-muted">部署分支</span>
          <input className={fieldClass} value={cfg.deploy.branch} onChange={(e) => update('deploy.branch', e.target.value)} placeholder="gh-pages" />
        </label>
        <label className="block">
          <span className="text-xs text-muted">自定义域名（可空）</span>
          <input className={fieldClass} value={cfg.deploy.domain} onChange={(e) => update('deploy.domain', e.target.value)} placeholder="blog.example.com" />
        </label>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={cfg.deploy.useSsh} onChange={(e) => update('deploy.useSsh', e.target.checked)} />
          <span className="text-sm">使用 SSH 推送（推荐，需先配置 SSH key）</span>
        </label>
        <label className="block">
          <span className="text-xs text-muted">Git 用户名</span>
          <input className={fieldClass} value={cfg.deploy.userName} onChange={(e) => update('deploy.userName', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs text-muted">Git 邮箱</span>
          <input className={fieldClass} value={cfg.deploy.userEmail} onChange={(e) => update('deploy.userEmail', e.target.value)} />
        </label>
      </section>

      <section className="rounded-xl border border-black/5 bg-black/[0.02] p-4 mb-6">
        <h3 className="font-medium text-text mb-3">部署命令</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-black/5 px-3 py-2 rounded font-mono">{deployCmd}</code>
          <button onClick={() => copy(deployCmd)} className="px-3 py-2 text-sm rounded-lg bg-black/5 hover:bg-black/10">复制</button>
        </div>
        <p className="text-xs text-muted mt-2">
          在项目根目录运行。脚本会自动：1）读取 <code>content/config.json</code>；2）<code>vite build</code>；3）将 <code>dist/</code> 推送到 <code>{cfg.deploy.branch}</code> 分支；4）写入 CNAME（如有自定义域名）。
        </p>
      </section>

      <section className="rounded-xl border border-black/5 p-4 mb-6">
        <h3 className="font-medium text-text mb-3">远端地址</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-16 text-muted">SSH</span>
            <code className="flex-1 bg-black/5 px-2 py-1 rounded font-mono text-xs">{sshRemote}</code>
            <button onClick={() => copy(sshRemote)} className="text-accent text-xs">复制</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-muted">HTTPS</span>
            <code className="flex-1 bg-black/5 px-2 py-1 rounded font-mono text-xs">{httpsRemote}</code>
            <button onClick={() => copy(httpsRemote)} className="text-accent text-xs">复制</button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-black/5 p-4 mb-6">
        <h3 className="font-medium text-text mb-3">部署后访问地址</h3>
        <ul className="text-sm space-y-1 text-text">
          <li>· GitHub Pages 默认：<a href={defaultPagesUrl} target="_blank" rel="noreferrer" className="text-accent break-all">{defaultPagesUrl}</a></li>
          {customDomain && <li>· 自定义域名：<a href={`https://${customDomain}`} target="_blank" rel="noreferrer" className="text-accent">https://{customDomain}</a></li>}
        </ul>
        {customDomain && (
          <p className="text-xs text-muted mt-2">
            已自动在 <code>dist/</code> 生成 <code>CNAME</code> 文件，并在 GitHub 仓库 Settings → Pages 中填入域名即可生效。
          </p>
        )}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="font-medium text-amber-800 mb-2">首次部署前的准备</h3>
        <ol className="text-sm text-amber-900 list-decimal pl-5 space-y-1">
          <li>在 GitHub 创建空仓库（不要勾选 README / .gitignore / license）。</li>
          <li>若使用 SSH：本地执行 <code className="bg-amber-100 px-1 rounded">ssh-keygen</code> 生成密钥，并将 <code>~/.ssh/id_ed25519.pub</code> 添加到 GitHub → Settings → SSH keys。</li>
          <li>仓库启用 Discussions（评论需要），并在仓库 Settings → Pages → Source 选择 <code>{cfg.deploy.branch}</code> 分支。</li>
          <li>运行 <code className="bg-amber-100 px-1 rounded">npm run deploy</code>，首次会提示是否信任远端指纹，输入 yes。</li>
        </ol>
        {!supported && (
          <p className="text-xs text-amber-700 mt-2">注：浏览器不支持本地文件直写，请直接编辑 <code>content/config.json</code> 后再运行部署脚本。</p>
        )}
      </section>
    </div>
  );
}
