import { Link } from 'react-router-dom';
import { getArchive } from '../lib/posts';

export default function Archive() {
  const archive = getArchive();
  const months = Object.keys(archive).sort().reverse();
  const total = Object.values(archive).reduce((s, a) => s + a.length, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-text mb-2">归档</h1>
      <p className="text-muted mb-8">共 {total} 篇文章</p>

      {months.length === 0 ? (
        <p className="text-muted">暂无文章。</p>
      ) : (
        months.map((month) => (
          <section key={month} className="mb-10">
            <h2 className="text-lg font-semibold text-text mb-4 sticky top-16 bg-bg/80 backdrop-blur py-2 -mx-2 px-2 rounded">
              {month}
              <span className="ml-2 text-sm text-muted">{archive[month].length} 篇</span>
            </h2>
            <ul className="space-y-3 border-l-2 border-black/5 pl-4">
              {archive[month].map((p) => (
                <li key={p.slug} className="relative">
                  <span className="absolute -left-[1.4rem] top-2 w-2 h-2 rounded-full bg-accent/60" />
                  <Link to={`/posts/${p.slug}`} className="block group">
                    <div className="text-text font-medium group-hover:text-accent transition-colors">{p.title}</div>
                    <div className="text-xs text-muted">
                      {p.date} · {p.readingTime} 分钟
                    </div>
                    {p.excerpt && <div className="text-sm text-muted mt-1 clamp-2">{p.excerpt}</div>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
