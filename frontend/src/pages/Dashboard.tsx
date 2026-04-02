import { useEffect, useState } from 'react';
import type { StatsOverview, TestRun } from '../api';
import { getStatsOverview, getScans, getPrompts, getModels } from '../api';
import type { Prompt, Model } from '../api';
import {
  ShieldAlert, ShieldCheck, Zap, AlertTriangle,
  TrendingUp, Activity, Target, Cpu, CheckCircle2
} from 'lucide-react';

const CATEGORY_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  prompt_injection: { bg: '#4c1d95', text: '#c4b5fd', label: 'Prompt Injection' },
  jailbreak: { bg: '#7f1d1d', text: '#fca5a5', label: 'Jailbreak' },
  data_exfiltration: { bg: '#78350f', text: '#fcd34d', label: 'Data Exfiltration' },
  normal: { bg: '#1e3a2f', text: '#6ee7b7', label: 'Baseline' },
};

const RISK_COLOR: Record<string, { dot: string; text: string }> = {
  high: { dot: '#ef4444', text: '#fca5a5' },
  medium: { dot: '#f59e0b', text: '#fcd34d' },
  low: { dot: '#10b981', text: '#6ee7b7' },
};

const SEV_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#10b981',
  none: '#475569',
};

function StatCard({ label, value, sub, icon: Icon, iconColor }: {
  label: string; value: string | number; sub?: string;
  icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#475569' }}>{label}</p>
          <p className="text-3xl font-bold" style={{ color: '#e2e8f0' }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: '#64748b' }}>{sub}</p>}
        </div>
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${iconColor}20` }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}

function BarChart({ data, label }: { data: { key: string; count: number; color?: string }[]; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#475569' }}>{label}</p>
      <div className="flex flex-col gap-2.5">
        {data.map(d => (
          <div key={d.key} className="flex items-center gap-3">
            <div className="w-28 text-xs truncate flex-shrink-0" style={{ color: '#94a3b8' }} title={d.key}>
              {CATEGORY_COLOR[d.key]?.label || d.key}
            </div>
            <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ backgroundColor: '#1e2236' }}>
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{ width: `${(d.count / max) * 100}%`, backgroundColor: d.color || '#6366f1' }}
              />
            </div>
            <span className="text-xs w-5 text-right flex-shrink-0 font-medium" style={{ color: '#94a3b8' }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [recentScans, setRecentScans] = useState<TestRun[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [modelsList, setModelsList] = useState<Model[]>([]);

  useEffect(() => {
    Promise.all([getStatsOverview(), getScans(), getPrompts(), getModels()]).then(([s, scans, p, m]) => {
      setStats(s);
      setRecentScans(scans.slice(0, 6));
      setPrompts(p);
      setModelsList(m);
    }).catch(() => {});
  }, []);

  const categoryColors: Record<string, string> = {
    prompt_injection: '#8b5cf6',
    jailbreak: '#ef4444',
    data_exfiltration: '#f59e0b',
    normal: '#10b981',
  };

  const riskColors: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={16} className="text-indigo-400" />
          <h1 className="text-xl font-semibold" style={{ color: '#e2e8f0' }}>Security Dashboard</h1>
        </div>
        <p className="text-sm" style={{ color: '#475569' }}>AI vulnerability detection &amp; testing overview — Multimodal LLM Security Suite</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <StatCard label="Total Scans" value={stats?.total_scans ?? '—'} sub={`${stats?.completed ?? 0} completed`} icon={Zap} iconColor="#6366f1" />
        <StatCard label="Vulnerabilities" value={stats?.vulnerable ?? '—'} sub="detected across all scans" icon={ShieldAlert} iconColor="#ef4444" />
        <StatCard label="Safe Results" value={stats?.safe ?? '—'} sub="passed security checks" icon={ShieldCheck} iconColor="#10b981" />
        <StatCard label="Detection Rate" value={`${stats?.detection_rate ?? 0}%`} sub="of results flagged" icon={Target} iconColor="#f59e0b" />
      </div>

      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {/* Category breakdown */}
        <div className="col-span-1 rounded-xl border p-5" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
          <BarChart
            label="Scans by Attack Category"
            data={(stats?.by_category ?? []).map(d => ({
              key: d.category,
              count: d.count,
              color: categoryColors[d.category] || '#6366f1',
            }))}
          />
        </div>

        {/* Risk distribution */}
        <div className="col-span-1 rounded-xl border p-5" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Risk Level Distribution</p>
          <div className="flex flex-col gap-3">
            {(stats?.by_risk ?? []).map(d => {
              const color = RISK_COLOR[d.risk_level] || RISK_COLOR.low;
              const total = (stats?.by_risk ?? []).reduce((a, b) => a + b.count, 0);
              const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
              return (
                <div key={d.risk_level}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.dot }} />
                      <span className="text-sm capitalize" style={{ color: color.text }}>{d.risk_level}</span>
                    </div>
                    <span className="text-xs" style={{ color: '#64748b' }}>{d.count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: '#1e2236' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color.dot }} />
                  </div>
                </div>
              );
            })}
            {!stats?.by_risk?.length && <p className="text-xs" style={{ color: '#475569' }}>No data yet</p>}
          </div>
        </div>

        {/* Coverage stats */}
        <div className="col-span-1 rounded-xl border p-5" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#475569' }}>Test Coverage</p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#0b0d14' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1e2236' }}>
                  <Cpu size={14} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>Models Tested</p>
                  <p className="text-xs" style={{ color: '#475569' }}>Active in registry</p>
                </div>
              </div>
              <span className="text-xl font-bold text-indigo-400">{modelsList.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#0b0d14' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1e2236' }}>
                  <TrendingUp size={14} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>Prompt Library</p>
                  <p className="text-xs" style={{ color: '#475569' }}>Test cases loaded</p>
                </div>
              </div>
              <span className="text-xl font-bold text-purple-400">{prompts.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#0b0d14' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1e2236' }}>
                  <CheckCircle2 size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>Completed Runs</p>
                  <p className="text-xs" style={{ color: '#475569' }}>Fully evaluated</p>
                </div>
              </div>
              <span className="text-xl font-bold text-emerald-400">{stats?.completed ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent scans table */}
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1e2236' }}>
          <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Recent Security Scans</p>
          <a href="/scans" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</a>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #1e2236' }}>
              {['Scan ID', 'Prompt', 'Category', 'Risk', 'Model', 'Status', 'Time'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentScans.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: '#475569' }}>No scans yet — initiate your first security test</td></tr>
            ) : recentScans.map(s => {
              const p = prompts.find(x => x.id === s.prompt_id);
              const m = modelsList.find(x => x.id === s.model_id);
              const catStyle = CATEGORY_COLOR[p?.category || ''] || { bg: '#1e3a2f', text: '#6ee7b7', label: p?.category || '' };
              const riskStyle = RISK_COLOR[p?.risk_level || 'low'] || RISK_COLOR.low;
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #1e2236' }}>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: '#64748b' }}>#{s.id}</td>
                  <td className="px-5 py-3 max-w-[200px]">
                    <p className="truncate text-xs" style={{ color: '#94a3b8' }} title={p?.input_text}>{p?.input_text?.slice(0, 55) || `Prompt #${s.prompt_id}`}</p>
                  </td>
                  <td className="px-5 py-3">
                    {p && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${catStyle.bg}80`, color: catStyle.text }}>{catStyle.label}</span>}
                  </td>
                  <td className="px-5 py-3">
                    {p && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: riskStyle.dot }} />
                        <span className="text-xs capitalize" style={{ color: riskStyle.text }}>{p.risk_level}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#64748b' }}>{m?.name || `Model #${s.model_id}`}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.run_status === 'completed' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-amber-900/50 text-amber-300'
                    }`}>
                      {s.run_status === 'completed' ? <CheckCircle2 size={10} /> : <Activity size={10} />}
                      {s.run_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#475569' }}>
                    {s.created_at ? new Date(s.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
