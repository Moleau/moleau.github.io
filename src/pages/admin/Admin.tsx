import { useEffect, useState } from 'react';
import { getStoredHandle, isFsSupported, pickProjectRoot } from '../../lib/fs';
import PostList from './PostList';
import Editor from './Editor';
import SettingsPanel from './SettingsPanel';
import DeployPanel from './DeployPanel';

type Tab = 'posts' | 'editor' | 'settings' | 'deploy';

interface EditorInit {
  slug?: string;
  fresh?: boolean;
}

export default function Admin() {
  const supported = isFsSupported();
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [tab, setTab] = useState<Tab>('posts');
  const [editorInit, setEditorInit] = useState<EditorInit>({});

  useEffect(() => {
    getStoredHandle().then(setHandle);
  }, []);

  const pick = async () => {
    const h = await pickProjectRoot();
    if (h) setHandle(h);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'posts', label: '文章' },
    { id: 'editor', label: '编辑器' },
    { id: 'settings', label: '设置' },
    { id: 'deploy', label: '部署' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text mb-2">管理后台</h1>
        {!supported && (
          <div className="text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-4 py-2.5">
            当前浏览器不支持 File System Access API。仍可编辑，但保存将通过下载文件实现，请手动将下载的文件放入 <code>content/</code> 目录。推荐使用 Chrome / Edge。
          </div>
        )}
        {supported && !handle && (
          <div className="text-sm bg-sky-50 text-sky-800 border border-sky-200 rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <span>授权访问项目根目录后，编辑内容可直接保存回磁盘。</span>
            <button onClick={pick} className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700">
              选择项目目录
            </button>
          </div>
        )}
        {supported && handle && (
          <div className="text-sm text-muted flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            已连接：<code>{handle.name}</code>
            <button onClick={pick} className="ml-2 text-accent underline">重选</button>
          </div>
        )}
      </header>

      <nav className="flex gap-1 mb-6 border-b border-black/5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              tab === t.id ? 'border-accent text-accent font-medium' : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'posts' && (
        <PostList
          onEdit={(slug) => { setEditorInit({ slug }); setTab('editor'); }}
          onNew={() => { setEditorInit({ fresh: true }); setTab('editor'); }}
        />
      )}
      {tab === 'editor' && (
        <Editor init={editorInit} />
      )}
      {tab === 'settings' && <SettingsPanel />}
      {tab === 'deploy' && <DeployPanel />}
    </div>
  );
}
