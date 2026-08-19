import { Link, useParams } from 'react-router-dom';
import { getPostBySlug, getAllPosts } from '../lib/posts';
import Markdown from '../components/Markdown';
import Comments from '../components/Comments';
import ShareButtons from '../components/ShareButtons';
import { config } from '../lib/config';

export default function PostView() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return null;
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <div className="max-w-prose mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold mb-2">文章不存在</h1>
        <p className="text-muted mb-6">找不到 slug 为 <code>{slug}</code> 的文章。</p>
        <Link to="/" className="text-accent">返回首页</Link>
      </div>
    );
  }

  const all = getAllPosts();
  const idx = all.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <div className="py-10">
      {/* Reading container: pure white card that sits on top of the
          site-wide background pattern so long-form text stays legible
          regardless of any custom background image/gradient. */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] border border-black/5">
          <div className="px-5 sm:px-10 lg:px-14 py-10 sm:py-14">
            <header className="mb-10">
              <div className="text-sm text-muted mb-4 flex items-center gap-3 flex-wrap">
                <time dateTime={post.date}>{post.date}</time>
                <span>·</span>
                <span>{post.readingTime} 分钟阅读</span>
                {post.tags && post.tags.length > 0 && (
                  <>
                    <span>·</span>
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((t) => (
                        <Link key={t} to={`/tags/${t}`} className="text-accent">#{t}</Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold text-text leading-tight">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-4 text-muted text-base sm:text-lg">{post.excerpt}</p>
              )}
            </header>

            {post.cover && (
              <img
                src={post.cover}
                alt={post.title}
                className="rounded-xl mb-10 w-full -mx-5 sm:-mx-10 lg:-mx-14 w-[calc(100%+2.5rem)] sm:w-[calc(100%+5rem)] lg:w-[calc(100%+7rem)]"
              />
            )}

            <div className="mx-auto max-w-prose">
              <Markdown content={post.content} />
            </div>

            <div className="mx-auto max-w-prose mt-14 pt-6 border-t border-black/5 flex items-center justify-between gap-4 flex-wrap">
              <ShareButtons title={post.title} path={`/posts/${post.slug}`} />
              <Link to="/" className="text-sm text-muted hover:text-accent">← 返回首页</Link>
            </div>
          </div>
        </div>

        {/* Prev/next */}
        {(prev || next) && (
          <nav className="grid sm:grid-cols-2 gap-4 mt-8 max-w-4xl mx-auto">
            {prev ? (
              <Link to={`/posts/${prev.slug}`} className="block p-4 rounded-xl bg-surface border border-black/5 hover:border-accent/40">
                <div className="text-xs text-muted">← 上一篇</div>
                <div className="text-sm font-medium text-text mt-1 truncate">{prev.title}</div>
              </Link>
            ) : <span />}
            {next ? (
              <Link to={`/posts/${next.slug}`} className="block p-4 rounded-xl bg-surface border border-black/5 hover:border-accent/40 text-right">
                <div className="text-xs text-muted">下一篇 →</div>
                <div className="text-sm font-medium text-text mt-1 truncate">{next.title}</div>
              </Link>
            ) : <span />}
          </nav>
        )}

        {/* Comments stay outside the reading card so the page-wide background
            still shows through; comment widgets are white anyway. */}
        <div className="mt-10 max-w-4xl mx-auto">
          <Comments />
        </div>
      </article>
    </div>
  );
}
