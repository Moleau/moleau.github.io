import type { PostFrontmatter, PostMeta } from './types';

// Eagerly import every Markdown file under content/posts so they end up
// in the production bundle and can be served statically.
const files = import.meta.glob('/content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): { fm: PostFrontmatter; body: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    return {
      fm: { title: 'Untitled', date: new Date().toISOString().slice(0, 10) },
      body: raw,
    };
  }
  const yamlBlock = match[1];
  const body = match[2];
  const fm: Record<string, unknown> = {};
  let currentKey = '';
  for (const line of yamlBlock.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    // list item under a sequence key
    const seqMatch = line.match(/^\s+-\s+(.*)$/);
    if (seqMatch && currentKey) {
      const existing = fm[currentKey];
      const value = seqMatch[1].replace(/^['"]|['"]$/g, '');
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        fm[currentKey] = [value];
      }
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      let value: unknown = kv[2].trim();
      // inline array [a, b, c]
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        value = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
      } else if (typeof value === 'string') {
        value = value.replace(/^['"]|['"]$/g, '');
        if (value === '') value = '';
      }
      fm[key] = value;
      currentKey = key;
    }
  }
  return { fm: fm as unknown as PostFrontmatter, body };
}

function readingTime(text: string): number {
  // ~400 wpm for Chinese/English mixed reading; count CJK chars + words.
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const words = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/\b\w+\b/g) || []).length;
  const total = cjk + words;
  return Math.max(1, Math.round(total / 400));
}

function slugify(path: string): string {
  return path.split('/').pop()!.replace(/\.md$/, '');
}

let cached: PostMeta[] | null = null;

export function getAllPosts(): PostMeta[] {
  if (cached) return cached;
  const posts: PostMeta[] = [];
  for (const [path, raw] of Object.entries(files)) {
    const { fm, body } = parseFrontmatter(raw);
    posts.push({
      slug: slugify(path),
      title: fm.title || slugify(path),
      date: fm.date || new Date().toISOString().slice(0, 10),
      tags: fm.tags || [],
      cover: fm.cover || '',
      excerpt: fm.excerpt || '',
      content: body,
      readingTime: readingTime(body),
    });
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  cached = posts;
  return posts;
}

export function getPostBySlug(slug: string): PostMeta | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getAllTags(): string[] {
  const set = new Set<string>();
  for (const p of getAllPosts()) p.tags?.forEach((t) => set.add(t));
  return Array.from(set).sort();
}

export function getArchive(): Record<string, PostMeta[]> {
  // Group by year-month descending
  const map: Record<string, PostMeta[]> = {};
  for (const p of getAllPosts()) {
    const key = p.date.slice(0, 7); // YYYY-MM
    (map[key] = map[key] || []).push(p);
  }
  return map;
}

// Raw markdown (with frontmatter) for editing.
const rawBySlug: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [path, raw] of Object.entries(files)) {
    map[slugify(path)] = raw;
  }
  return map;
})();

export function getRawMarkdown(slug: string): string | undefined {
  return rawBySlug[slug];
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || `post-${Date.now().toString(36)}`;
}
