import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { config } from '../lib/config';

// Giscus integration. Loads the giscus widget script and posts a message
// whenever the route changes so the comments thread matches the current post.
export default function Comments() {
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const { provider, giscus } = config.comments;

  useEffect(() => {
    if (provider !== 'giscus' || !giscus.repoId || !giscus.categoryId) return;
    if (ref.current && ref.current.children.length === 0) {
      const s = document.createElement('script');
      s.src = 'https://giscus.app/client.js';
      s.setAttribute('data-repo', giscus.repo);
      s.setAttribute('data-repo-id', giscus.repoId);
      s.setAttribute('data-category', giscus.category);
      s.setAttribute('data-category-id', giscus.categoryId);
      s.setAttribute('data-mapping', giscus.mapping);
      s.setAttribute('data-theme', giscus.theme);
      s.setAttribute('data-strict', '0');
      s.setAttribute('data-reactions-enabled', '1');
      s.setAttribute('data-input-position', 'top');
      s.setAttribute('data-lang', 'zh-CN');
      s.setAttribute('data-loading', 'lazy');
      s.crossOrigin = 'anonymous';
      s.async = true;
      ref.current.appendChild(s);
    }
  }, [provider, giscus]);

  useEffect(() => {
    if (provider !== 'giscus') return;
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (iframe) {
      iframe.contentWindow?.postMessage(
        {
          giscus: {
            setConfig: {
              theme: giscus.theme,
            },
          },
        },
        'https://giscus.app'
      );
    }
  }, [pathname, provider, giscus.theme]);

  if (provider !== 'giscus' || !giscus.repoId || !giscus.categoryId) {
    return (
      <div className="mt-10 p-6 rounded-xl bg-black/5 text-center text-sm text-muted">
        评论功能未配置。请在「管理 → 设置 → 评论」中填写 Giscus 的 repoId 与 categoryId。
      </div>
    );
  }

  return <div ref={ref} className="giscus mt-10" />;
}
