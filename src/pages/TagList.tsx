import { Link, useParams } from 'react-router-dom';
import { getAllPosts, getAllTags } from '../lib/posts';
import PostCard from '../components/PostCard';

export default function TagList() {
  const { tag } = useParams<{ tag?: string }>();
  const tags = getAllTags();

  if (!tag) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold text-text mb-6">标签</h1>
        {tags.length === 0 ? (
          <p className="text-muted">暂无标签。</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((t) => {
              const count = getAllPosts().filter((p) => p.tags?.includes(t)).length;
              return (
                <Link
                  key={t}
                  to={`/tags/${t}`}
                  className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm hover:bg-accent hover:text-white transition-colors"
                >
                  #{t} <span className="opacity-60 ml-1">{count}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const posts = getAllPosts().filter((p) => p.tags?.includes(tag));
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-text mb-2">
        标签：<span className="text-accent">#{tag}</span>
      </h1>
      <p className="text-muted mb-8">{posts.length} 篇文章</p>
      {posts.length === 0 ? (
        <p className="text-muted">该标签下暂无文章。</p>
      ) : (
        <div className="grid gap-6">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
