import type { SiteConfig } from './types';
import rawConfig from '../../content/config.json';

// The user-edited config file is imported at build time.
export const config = rawConfig as SiteConfig;

// Apply theme CSS variables at runtime so the deployed site honors the
// user's customizations without a rebuild.
export function applyTheme(cfg: SiteConfig = config): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--accent', cfg.theme.accent);
  root.style.setProperty('--bg', cfg.theme.background);
  root.style.setProperty('--surface', cfg.theme.surface);
  root.style.setProperty('--text', cfg.theme.text);
  root.style.setProperty('--muted', cfg.theme.muted);
}

export function updateConfig(patch: Partial<SiteConfig>): SiteConfig {
  return Object.assign({}, config, patch);
}
