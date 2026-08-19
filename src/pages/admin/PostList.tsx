import { Link } from 'react-router-dom';
import { getAllPosts } from '../../lib/posts';
import { isFsSupported, listFiles } from '../../lib/fs';
import { useEffect, useState } from 'react';

interface Props {
  onEdit: (slug: string) => void;
  onNew: () => void;
}

export default function PostList({ onEdit, onNew }: Props) {
  const posts = getAllPosts();
  const [diskOnly, setDiskOnly] = useState<string[]>([]);

  useEffect(() => {
    if (!isFsSupported()) return;
    listFiles('content/posts').then((files) => {
      const known = new Set(posts.map((p) => `${p.slug}.md`));
      const extra = files.filter((f) => f.endsWith('.md') && !known.has(f));
      setDiskOnly(extra);
    });
  }, [posts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text">文章列表</h2>
        <button onClick={onNew} className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:opacity-90">
          + 新建文章
        </button>
      </div>

      <div className="rounded-xl border border-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-muted">
            <tr>
              <th className="text-left px-4 py-2 font-medium">标题</th>
              <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">日期</th>
              <th className="text-left px-4 py-2 font-medium hidden md:table-cell">标签</th>
              <th className="text-right px-4 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.slug} className="border-t border-black/5 hover:bg-black/[0.02]">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-text truncate">{p.title}</div>
                  <div className="text-xs text-muted truncate">{p.slug}.md</div>
                </td>
                <td className="px-4 py-2.5 text-muted hidden sm:table-cell">{p.date}</td>
                <td className="px-4 py-2.5 hidden md:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    {(p.tags || []).map((t) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">#{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <button onClick={() => onEdit(p.slug)} className="text-accent hover:underline mr-3">编辑</button>
                  <Link to={`/posts/${p.slug}`} className="text-muted hover:underline" target="_blank">预览</Link>
                </td>
              </tr>
            ))}
            {diskOnly.map((f) => (
              <tr key={f} className="border-t border-black/5 hover:bg-black/[0.02]">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-text">{f}</div>
                  <div className="text-xs text-amber-600">磁盘存在但未编译进页面，请重启 dev server</div>
                </td>
                <td className="px-4 py-2.5 text-muted hidden sm:table-cell">—</td>
                <td className="px-4 py-2.5 hidden md:table-cell">—</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => onEdit(f.replace(/\.md$/, ''))} className="text-accent hover:underline">编辑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
