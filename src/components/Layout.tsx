import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { config } from '../lib/config';
import SearchBar from './SearchBar';
import MusicPlayer from './MusicPlayer';

export default function Layout() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const nav = [
    { to: '/', label: '首页' },
    { to: '/archive', label: '归档' },
    { to: '/tags', label: '标签' },
    // Admin entry only appears locally; the deployed site hides it.
    ...(import.meta.env.DEV ? [{ to: '/admin', label: '管理' }] : []),
  ];

  const bg = config.personalization.background;

  return (
    <div className="min-h-screen flex flex-col relative">
      {bg && (
        <div
          aria-hidden
          className="fixed inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage: `url(${bg})`,
            opacity: config.personalization.backgroundOpacity,
          }}
        />
      )}

      <header className="sticky top-0 z-40 backdrop-blur-md bg-surface/80 border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src={config.personalization.avatar}
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-black/5"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="leading-tight">
              <div className="font-semibold text-text text-[0.95rem]">
                {config.site.title}
              </div>
              <div className="text-[0.7rem] text-muted -mt-0.5 hidden sm:block">
                {config.site.subtitle}
              </div>
            </div>
          </Link>

          <nav className="ml-auto hidden md:flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  pathname === n.to
                    ? 'text-white bg-accent'
                    : 'text-muted hover:text-text'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto md:ml-2 w-full max-w-xs">
            <SearchBar />
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-black/5"
            onClick={() => setOpen(!open)}
            aria-label="menu"
          >
            <span className="block w-5 h-0.5 bg-text mb-1.5" />
            <span className="block w-5 h-0.5 bg-text mb-1.5" />
            <span className="block w-5 h-0.5 bg-text" />
          </button>
        </div>

        {open && (
          <nav className="md:hidden flex flex-col gap-1 px-4 pb-4 border-t border-black/5">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-2 rounded-lg text-sm ${
                  pathname === n.to ? 'text-white bg-accent' : 'text-text'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 animate-fade-in">
        <Outlet />
      </main>

      <footer className="border-t border-black/5 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center text-sm text-muted">
          <div className="flex items-center justify-center gap-4 mb-3">
            {config.personalization.social.github && (
              <a href={config.personalization.social.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                GitHub
              </a>
            )}
            {config.personalization.social.twitter && (
              <a href={config.personalization.social.twitter} target="_blank" rel="noreferrer">
                Twitter
              </a>
            )}
            {config.personalization.social.email && (
              <a href={config.personalization.social.email}>Email</a>
            )}
          </div>
          <p>{config.personalization.footerText}</p>
        </div>
      </footer>

      <MusicPlayer />
    </div>
  );
}
