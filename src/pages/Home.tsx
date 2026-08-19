import { Link } from 'react-router-dom';
import { config } from '../lib/config';
import { getAllPosts } from '../lib/posts';
import PostCard from '../components/PostCard';

export default function Home() {
  const posts = getAllPosts();
  const pinned = posts[0];
  const rest = posts.slice(1, 1 + config.theme.postsPerPage);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <section className="text-center mb-12">
        <img
          src={config.personalization.avatar}
          alt="avatar"
          className="w-20 h-20 rounded-full mx-auto ring-2 ring-black/5 shadow-sm mb-4"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
        />
        <h1 className="text-3xl sm:text-4xl font-bold text-text">{config.site.title}</h1>
        <p className="mt-3 text-muted max-w-prose mx-auto">{config.site.description}</p>
      </section>

      {/* Pinned / latest post */}
      {pinned && (
        <section className="mb-12">
          <Link to={`/posts/${pinned.slug}`} className="block group">
            <article className="rounded-3xl overflow-hidden border border-black/5 bg-surface hover:shadow-xl transition-shadow">
              {pinned.cover && (
                <div className="aspect-[16/7] bg-black/5">
                  <img src={pinned.cover} alt={pinned.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              {/* No cover → render a compact text-only card, no empty placeholder. */}
              <div className={`p-6 ${!pinned.cover ? 'md:p-8' : ''}`}>
                <div className="flex items-baseline gap-3 flex-wrap mb-3">
                  <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                    最新文章
                  </span>
                  <span className="text-xs text-muted">{pinned.date} · {pinned.readingTime} 分钟阅读</span>
                </div>
                <h2 className={`font-bold text-text mb-3 ${pinned.cover ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
                  {pinned.title}
                </h2>
                {pinned.excerpt && (
                  <p className={`text-muted ${pinned.cover ? 'text-sm' : 'text-base'}`}>{pinned.excerpt}</p>
                )}
                <span className="inline-block mt-4 text-accent text-sm font-medium">阅读全文 →</span>
              </div>
            </article>
          </Link>
        </section>
      )}

      {/* List */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl font-semibold text-text">全部文章</h2>
          <Link to="/archive" className="text-sm text-accent">归档 →</Link>
        </div>
        {rest.length === 0 ? (
          <p className="text-muted text-center py-12">还没有其他文章，去 <Link to="/admin" className="text-accent">管理</Link> 写一篇吧。</p>
        ) : (
          <div className={config.theme.layout === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid gap-6'}>
            {rest.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
