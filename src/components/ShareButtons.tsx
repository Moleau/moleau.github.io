import type { MouseEvent } from 'react';
import { config } from '../lib/config';

interface Props {
  title: string;
  path: string;
}

export default function ShareButtons({ title, path }: Props) {
  const base = config.site.url.replace(/\/$/, '');
  const fullUrl = base + path;

  const targets = [
    {
      name: 'Twitter / X',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
      svg: '<path d="M18.9 2H22l-7.3 8.3L23 22h-6.8l-5-6.5L5.4 22H2.3l7.8-8.9L1.6 2h6.9l4.6 6z"/>',
    },
    {
      name: '微博',
      url: `https://service.weibo.com/share/share.php?title=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
      svg: '<path d="M10 18.5c-3.6.3-6.7-1-6.9-3-.2-2 2.5-3.9 6.1-4.2 3.6-.3 6.7 1 6.9 3 .2 2-2.5 3.9-6.1 4.2zM9.7 14c-1.4.1-2.6.9-2.6 1.8 0 .9 1.1 1.6 2.5 1.5 1.4-.1 2.6-.9 2.6-1.8 0-.9-1.1-1.6-2.5-1.5z"/>',
    },
    {
      name: '复制链接',
      url: '#copy',
      svg: '<path d="M10 13a5 5 0 0 0 7.07 0l3-3A5 5 0 1 0 13 3l-1.5 1.5M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 1 0 11 21l1.5-1.5"/>',
    },
    {
      name: '二维码',
      url: '#qr',
      svg: '<path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h2v2h-2zm5 0h2v2h-2zm-5 5h2v2h-2zm5 0h2v2h-2z"/>',
    },
  ];

  const onClick = async (e: MouseEvent, url: string, name: string) => {
    e.preventDefault();
    if (url === '#copy') {
      try {
        await navigator.clipboard.writeText(fullUrl);
        alert('已复制链接：' + fullUrl);
      } catch {
        prompt('请手动复制：', fullUrl);
      }
      return;
    }
    if (url === '#qr') {
      window.open(
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullUrl)}`,
        '_blank'
      );
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl });
      } catch {}
    } else {
      onClick({ preventDefault() {} } as unknown as MouseEvent, '#copy', 'copy');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted">分享：</span>
      {targets.map((t) => (
        <a
          key={t.name}
          href={t.url}
          onClick={(e) => onClick(e, t.url, t.name)}
          className="w-8 h-8 rounded-full bg-black/5 hover:bg-accent hover:text-white flex items-center justify-center transition-colors"
          title={t.name}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} dangerouslySetInnerHTML={{ __html: t.svg }} />
        </a>
      ))}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button
          onClick={share}
          className="text-xs px-2.5 py-1 rounded-full bg-accent text-white"
        >
          系统分享
        </button>
      )}
    </div>
  );
}
