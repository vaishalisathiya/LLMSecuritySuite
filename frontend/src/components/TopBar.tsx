import { useLocation } from 'react-router-dom';
import { Search, Bell, Settings, UserRound } from 'lucide-react';

const TITLES: Record<string, string> = {
  '/': 'Security Dashboard',
  '/scans': 'Security Scans',
  '/reports': 'Vulnerability Reports',
  '/prompts': 'Prompt Library',
  '/models': 'Model Registry',
};

const SEARCH_PLACEHOLDER: Record<string, string> = {
  '/': 'Search logs...',
  '/scans': 'Search scans...',
  '/reports': 'Search reports...',
  '/prompts': 'Search prompts...',
  '/models': 'Search models...',
};

/**
 * Global header only — search is decorative (no routing or API).
 */
export default function TopBar() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'LLM Security Suite';
  const searchPlaceholder = SEARCH_PLACEHOLDER[pathname] ?? 'Search...';

  return (
    <header className="flex shrink-0 items-center gap-5 border-b border-white/[0.06] bg-surface-base px-6 py-5 lg:px-10">
      <h1 className="min-w-0 pr-2 font-heading text-xl font-semibold leading-tight tracking-tight text-fg-strong lg:text-2xl">
        {title}
      </h1>

      <div className="mx-auto flex max-w-xl flex-1 justify-center">
        <label className="flex w-full max-w-md items-center gap-0 rounded-full border border-white/[0.08] bg-surface-panel/90 px-4 py-0.5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.65)] transition-colors focus-within:border-accent/35 focus-within:ring-1 focus-within:ring-accent/15">
          <Search size={18} className="pointer-events-none shrink-0 text-fg-muted" strokeWidth={2} aria-hidden />
          <input
            type="search"
            name="global-search"
            placeholder={searchPlaceholder}
            autoComplete="off"
            className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-3 pr-2 text-sm text-fg outline-none placeholder:text-fg-muted/75"
            readOnly
            aria-readonly="true"
            title="Search (coming soon)"
          />
        </label>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg-strong"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg-strong"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg-strong"
          aria-label="Account"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface-panel text-fg-muted">
            <UserRound size={16} />
          </span>
        </button>
      </div>
    </header>
  );
}
