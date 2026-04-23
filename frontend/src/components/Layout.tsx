import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Cpu, FileText, Shield, ShieldAlert, FileBarChart2, Plus } from 'lucide-react';
import TopBar from './TopBar';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scans', label: 'Scans', icon: Shield },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/prompts', label: 'Prompt Library', icon: FileText },
  { to: '/models', label: 'Model Registry', icon: Cpu },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-surface-void text-fg">
      <aside className="flex w-[304px] flex-shrink-0 flex-col border-r border-border-subtle bg-surface-base">
        {/* Brand — dominant, generous vertical rhythm */}
        <div className="border-b border-border-subtle px-7 pb-12 pt-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-accent/35 bg-accent-secondary/35 text-accent shadow-[0_0_0_1px_rgba(34,255,233,0.08)]">
              <ShieldAlert size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="font-heading text-[20px] font-semibold leading-snug tracking-tight text-accent lg:text-[22px]">
                LLM Security Suite
              </p>
              <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.26em] text-fg-muted">
                Vulnerability Lab
              </p>
            </div>
          </div>
        </div>

        {/* Nav — pushed down from brand; tall rows; clear vertical separation */}
        <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-8 pt-14">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-4 rounded-xl py-5 pl-4 pr-4 text-[16px] font-medium leading-snug transition-colors ${
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
        <div className="mt-auto border-t border-white/[0.04] px-5 pb-9 pt-8">
          <NavLink
            to="/scans?new=1"
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-accent py-4 text-[16px] font-semibold text-surface-void transition-colors hover:bg-accent/90"
          >
            <Plus size={20} strokeWidth={2.5} />
            New Scan
          </NavLink>
        </div>
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
