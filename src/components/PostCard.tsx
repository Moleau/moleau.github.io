import { Link } from 'react-router-dom';
import type { PostMeta } from '../lib/types';

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="group rounded-2xl border border-black/5 bg-surface overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/posts/${post.slug}`} className="block">
        {post.cover && (
          <div className="aspect-[16/9] overflow-hidden bg-black/5">
            <img
              src={post.cover}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-3 text-xs text-muted mb-2">
            <time dateTime={post.date}>{post.date}</time>
            <span>·</span>
            <span>{post.readingTime} 分钟阅读</span>
          </div>
          <h3 className="text-lg font-semibold text-text group-hover:text-accent transition-colors clamp-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-2 text-sm text-muted clamp-3">{post.excerpt}</p>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
