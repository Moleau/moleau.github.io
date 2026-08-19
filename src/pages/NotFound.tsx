import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-prose mx-auto px-4 py-24 text-center">
      <div className="text-6xl font-bold text-accent mb-4">404</div>
      <p className="text-muted mb-6">你访问的页面不存在或已被移走。</p>
      <Link to="/" className="text-accent">返回首页 →</Link>
    </div>
  );
}
