import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FlexSearch from 'flexsearch';
import { getAllPosts } from '../lib/posts';
import type { PostMeta } from '../lib/types';

interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const index = useMemo(() => {
    const idx = new FlexSearch.Index({ tokenize: 'forward', cache: true });
    const posts = getAllPosts();
    posts.forEach((p, i) => {
      idx.add(i, `${p.title} ${p.excerpt} ${p.content} ${(p.tags || []).join(' ')}`);
    });
    return { idx, posts };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const ids = index.idx.search(query.trim(), 8) as number[] | string[];
    const arr = Array.isArray(ids) ? ids.map((n) => Number(n)) : [];
    setResults(
      arr.map((i) => {
        const p: PostMeta = index.posts[i];
        const snippet = makeSnippet(p.content, query.trim());
        return {
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt || snippet,
          date: p.date,
        };
      })
    );
  }, [query, index]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const submit = (slug?: string) => {
    if (slug) {
      navigate(`/posts/${slug}`);
    }
    setFocused(false);
    setQuery('');
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        type="search"
        value={query}
        placeholder="搜索博文…"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) submit(results[0].slug);
        }}
        className="w-full text-sm px-3 py-1.5 rounded-full bg-black/5 border border-transparent focus:bg-surface focus:border-accent/40 outline-none transition-colors"
      />
      {focused && results.length > 0 && (
        <div className="absolute right-0 left-0 md:left-auto md:w-80 mt-2 bg-surface rounded-xl border border-black/10 shadow-xl overflow-hidden z-50">
          {results.map((r) => (
            <button
              key={r.slug}
              onMouseDown={() => submit(r.slug)}
              className="block w-full text-left px-4 py-2.5 hover:bg-accent/5 border-b border-black/5 last:border-0"
            >
              <div className="text-sm font-medium text-text truncate">{r.title}</div>
              <div className="text-xs text-muted truncate">{r.date} · {r.excerpt}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function makeSnippet(content: string, q: string): string {
  const plain = content.replace(/[#>*`~\-\[\]\(\)!]/g, ' ').replace(/\s+/g, ' ').trim();
  const i = plain.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return plain.slice(0, 80);
  const start = Math.max(0, i - 30);
  return (start > 0 ? '…' : '') + plain.slice(start, start + 80) + '…';
}
