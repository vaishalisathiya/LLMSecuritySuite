import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, UserRound, LogOut } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

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

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = TITLES[pathname] ?? 'LLM Security Suite';
  const searchPlaceholder = SEARCH_PLACEHOLDER[pathname] ?? 'Search...';

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) as { name: string; username: string } : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function logout() {
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    <header className="flex min-h-[88px] shrink-0 flex-col gap-6 border-b border-white/[0.06] bg-surface-base py-7 lg:min-h-[96px] lg:flex-row lg:items-center lg:gap-10 lg:py-8 xl:gap-12" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
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
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            className="rounded-xl p-2.5 text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg-strong"
            aria-label="Account"
            aria-expanded={menuOpen}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-panel text-fg-muted">
              <UserRound size={20} />
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/[0.08] bg-surface-panel shadow-[0_18px_48px_-12px_rgba(0,0,0,0.85)] z-50">
              {user && (
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <p className="text-sm font-semibold text-fg-strong truncate">{user.name}</p>
                  <p className="text-xs text-fg-muted truncate">@{user.username}</p>
                </div>
              )}
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg-strong"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
