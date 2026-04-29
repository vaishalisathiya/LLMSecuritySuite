import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Cpu, FileText, Zap, ShieldAlert, FileBarChart2 } from 'lucide-react';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scans', label: 'Scans', icon: Zap },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/prompts', label: 'Prompt Library', icon: FileText },
  { to: '/models', label: 'Model Registry', icon: Cpu },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0b0d14' }}>
      <aside className="w-60 flex-shrink-0 flex flex-col border-r" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: '#1e2236' }}>
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: '#e2e8f0' }}>LLM Security Suite</p>
              <p className="text-xs" style={{ color: '#475569' }}>AI Vulnerability Testing</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t" style={{ borderColor: '#1e2236' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs" style={{ color: '#475569' }}>System operational</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-auto" style={{ backgroundColor: '#0b0d14' }}>
        <Outlet />
      </main>
    </div>
  );
}
