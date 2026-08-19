import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  content: string;
}

// Rewrite relative markdown links (other posts) into SPA routes.
function linkRewriter({ href, children }: { href?: string; children?: ReactNode }) {
  if (!href) return null;
  const internal = /^\/posts\/([\w-]+)/.exec(href) || /^\.?\/?([\w-]+)\.md$/.exec(href);
  if (internal) {
    const slug = internal[1];
    return (
      <Link to={`/posts/${slug}`} state={{ from: 'post' }}>
        {children}
      </Link>
    );
  }
  return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{children}</a>;
}

export default function Markdown({ content }: Props) {
  const components = useMemo(
    () => ({
      a: linkRewriter,
    }),
    []
  );

  return (
    <div className="prose max-w-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
