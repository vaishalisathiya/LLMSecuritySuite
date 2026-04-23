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
    <header className="flex min-h-[88px] shrink-0 flex-col gap-6 border-b border-white/[0.06] bg-surface-base px-6 py-7 lg:min-h-[96px] lg:flex-row lg:items-center lg:gap-10 lg:px-10 lg:py-8 xl:gap-12">
      {/* Page title — fixed width band so search can expand */}
      <h1 className="shrink-0 font-heading text-2xl font-semibold leading-tight tracking-tight text-fg-strong lg:text-[30px] lg:leading-snug">
        {title}
      </h1>

      {/* Search — grows with available space, visually central */}
      <div className="flex min-w-0 flex-1 justify-center lg:px-2">
        <label className="flex h-full w-full max-w-[min(100%,52rem)] items-center gap-3 rounded-full border border-white/[0.1] bg-surface-panel/95 px-6 py-2 shadow-[0_14px_48px_-18px_rgba(0,0,0,0.78)] transition-colors focus-within:border-accent/35 focus-within:ring-1 focus-within:ring-accent/15">
          <Search size={22} className="pointer-events-none shrink-0 text-fg-muted" strokeWidth={2} aria-hidden />
          <input
            type="search"
            name="global-search"
            placeholder={searchPlaceholder}
            autoComplete="off"
            className="min-w-0 flex-1 border-0 bg-transparent py-3.5 pl-0.5 pr-2 text-[16px] text-fg outline-none placeholder:text-fg-muted/75"
            readOnly
            aria-readonly="true"
            title="Search (coming soon)"
          />
        </label>
      </div>

      {/* Utility icons — spaced, not cramped */}
      <div className="flex shrink-0 items-center justify-start gap-4 lg:justify-end lg:gap-5 lg:pl-2">
        <button
          type="button"
          className="rounded-xl p-3 text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg-strong"
          aria-label="Notifications"
        >
          <Bell size={22} />
        </button>
        <button
          type="button"
          className="rounded-xl p-3 text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg-strong"
          aria-label="Settings"
        >
          <Settings size={22} />
        </button>
        <button
          type="button"
          className="rounded-xl p-2.5 text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg-strong"
          aria-label="Account"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-panel text-fg-muted">
            <UserRound size={20} />
          </span>
        </button>
      </div>
    </header>
  );
}
