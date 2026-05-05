import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Cpu, FileText, Shield, ShieldAlert, FileBarChart2, Plus } from 'lucide-react';
import TopBar from './TopBar';
import { useState } from 'react';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scans', label: 'Scans', icon: Shield },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/prompts', label: 'Prompt Library', icon: FileText },
  { to: '/models', label: 'Model Registry', icon: Cpu },
];

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 500;
const SIDEBAR_DEFAULT = 304;

export default function Layout() {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem('sidebarWidth');
    return stored ? Number(stored) : SIDEBAR_DEFAULT;
  });

  // Scales from 1 at default width down to ~0.66 at minimum; never exceeds 1
  const fontScale = Math.min(1, sidebarWidth / SIDEBAR_DEFAULT);

  function handleResizeMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function onMouseMove(ev: MouseEvent) {
      const next = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, startWidth + ev.clientX - startX));
      setSidebarWidth(next);
    }

    function onMouseUp(ev: MouseEvent) {
      const final = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, startWidth + ev.clientX - startX));
      localStorage.setItem('sidebarWidth', String(final));
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  return (
    <div className="flex min-h-screen bg-surface-void text-fg">
      <aside
        className="relative flex flex-shrink-0 flex-col border-r border-border-subtle bg-surface-base"
        style={{ width: sidebarWidth }}
      >
        {/* Brand — dominant, generous vertical rhythm */}
        <div className="border-b border-border-subtle px-7 pb-12 pt-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-accent/35 bg-accent-secondary/35 text-accent shadow-[0_0_0_1px_rgba(34,255,233,0.08)]">
              <ShieldAlert size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-0.5">
              <p
                className="font-heading font-semibold leading-snug tracking-tight text-accent"
                style={{ fontSize: Math.max(13, 20 * fontScale) }}
              >
                LLM Security Suite
              </p>
              <p
                className="mt-3 font-semibold uppercase tracking-[0.26em] text-fg-muted"
                style={{ fontSize: Math.max(9, 12 * fontScale) }}
              >
                Vulnerability Lab
              </p>
            </div>
          </div>
        </div>

        {/* Nav — pushed down from brand; tall rows; clear vertical separation */}
        <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-8" style={{ paddingLeft: '10px', paddingRight: '8px', paddingTop: '10px' }}>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={{ fontSize: Math.max(11, 16 * fontScale), paddingLeft: '8px', paddingRight: '8px' }}
              className={({ isActive }) =>
                `relative flex items-center gap-4 rounded-xl py-5 font-medium leading-snug transition-colors ${
                  isActive
                    ? 'text-accent before:pointer-events-none before:absolute before:right-0 before:top-3 before:bottom-3 before:block before:w-0.5 before:rounded-full before:bg-accent'
                    : 'text-fg-muted hover:bg-white/[0.04] hover:text-fg-strong'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.25 : 2}
                    className={`flex-shrink-0 ${isActive ? 'text-accent' : 'opacity-90'}`}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* New Scan — anchored bottom with clear separation from nav */}
        <div className="mt-auto border-t border-white/[0.04] pb-9 pt-8" style={{ paddingLeft: '20px', paddingRight: '16px', marginBottom: '1.5rem' }}>
          <NavLink
            to="/scans?new=1"
            style={{ fontSize: Math.max(11, 16 * fontScale) }}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-accent py-4 font-semibold text-surface-void transition-colors hover:bg-accent/90"
          >
            <Plus size={20} strokeWidth={2.5} />
            New Scan
          </NavLink>
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute inset-y-0 right-0 w-1 cursor-col-resize transition-colors hover:bg-accent/50 active:bg-accent/70 z-10"
        />
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-void">
        <TopBar />
        <div className="min-h-0 flex-1 overflow-auto bg-surface-void [background-image:radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(34,255,233,0.07),transparent_55%)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
