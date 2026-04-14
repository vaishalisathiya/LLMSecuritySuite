import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Cpu, FileText, Zap, ShieldAlert, FileBarChart2, Plus } from 'lucide-react';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scans', label: 'Scans', icon: Zap },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/prompts', label: 'Prompt Library', icon: FileText },
  { to: '/models', label: 'Model Registry', icon: Cpu },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-surface-void text-fg">
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-border-subtle bg-surface-base">
        <div className="border-b border-border-subtle px-5 py-6">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent-secondary/30 text-accent">
              <ShieldAlert size={15} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-[15px] font-semibold leading-tight tracking-tight text-accent">
                LLM Security Suite
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                Vulnerability Lab
              </p>
            </div>
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-accent before:pointer-events-none before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:block before:w-0.5 before:rounded-full before:bg-accent'
                    : 'text-fg-muted hover:bg-white/[0.04] hover:text-fg-strong'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.25 : 2}
                    className={`flex-shrink-0 ${isActive ? 'text-accent' : 'opacity-90'}`}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-5 pt-2">
          <NavLink
            to="/scans"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-semibold text-surface-void transition-colors hover:bg-accent/90"
          >
            <Plus size={17} strokeWidth={2.5} />
            New Scan
          </NavLink>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-surface-void">
        <Outlet />
      </main>
    </div>
  );
}
