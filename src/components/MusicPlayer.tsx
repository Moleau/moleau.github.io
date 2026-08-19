import { useEffect, useRef, useState } from 'react';
import { config } from '../lib/config';

export default function MusicPlayer() {
  const { music } = config.personalization;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!music.enabled || !music.src) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (music.autoplay) {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [music.enabled, music.src, music.autoplay]);

  if (!music.enabled || !music.src) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-30">
      <audio ref={audioRef} src={music.src} loop preload="none" />
      <button
        onClick={toggle}
        className="w-12 h-12 rounded-full bg-accent text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        title={music.title || '背景音乐'}
        aria-label="toggle music"
      >
        {playing ? (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      {music.title && playing && (
        <div className="absolute right-14 top-1/2 -translate-y-1/2 bg-surface border border-black/10 rounded-full px-3 py-1 text-xs whitespace-nowrap shadow">
          {music.title}
        </div>
      )}
    </div>
  );
}
