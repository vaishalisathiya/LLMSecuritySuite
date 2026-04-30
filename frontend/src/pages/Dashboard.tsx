import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { StatsOverview, TestRun } from '../api';
import { getStatsOverview, getScans, getPrompts, getModels } from '../api';
import type { Prompt, Model } from '../api';
import { ShieldAlert, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import { SURFACE_CARD } from '../ui/surfaces';
import { Page } from '../ui/page';

const cardShell = SURFACE_CARD;

const CATEGORY_BADGE: Record<string, { bg: string; fg: string; label: string }> = {
  prompt_injection: { bg: 'rgba(34,255,233,0.12)', fg: '#22ffe9', label: 'PROMPT INJECTION' },
  jailbreak: { bg: 'rgba(148,163,184,0.15)', fg: 'rgba(148,163,184,0.9)', label: 'JAILBREAK' },
  data_exfiltration: { bg: 'rgba(34,255,233,0.12)', fg: '#22ffe9', label: 'DATA EXFILTRATION' },
  normal: { bg: 'rgba(34,255,233,0.12)', fg: 'rgba(34,255,233,0.9)', label: 'BASELINE' },
};

const CATEGORY_AXIS = ['prompt_injection', 'jailbreak', 'normal', 'data_exfiltration'] as const;
const CATEGORY_AXIS_LABEL: Record<string, string> = {
  prompt_injection: 'PROMPT INJECTION',
  jailbreak: 'JAILBREAK',
  normal: 'BASELINE',
  data_exfiltration: 'DATA EXFILTRATION',
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(iso).toLocaleDateString();
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconMuted,
}: {
  label: string;
  value: string | number;
  icon?: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>;
  iconColor?: string;
  iconMuted?: boolean;
}) {
  return (
    <div className={`${cardShell} flex min-h-[118px] flex-col justify-center`} style={{ padding: '24px 12px' }}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted/70">
        {label}
      </p>
      <div className="flex items-end gap-2">
        <p className="font-heading text-[34px] font-semibold leading-none tracking-tight text-fg-strong">
          {value}
        </p>
        {Icon && iconColor && (
          <Icon size={14} style={{ color: iconColor, opacity: iconMuted ? 0.5 : 1 }} />
        )}
      </div>
    </div>
  );
}

function AttackCategoryPanel({ byCategory }: { byCategory: { category: string; count: number }[] }) {
  const countBy = useMemo(() => {
    const out: Record<string, number> = {};
    for (const r of byCategory) out[r.category] = (out[r.category] ?? 0) + r.count;
    return out;
  }, [byCategory]);
  const max = Math.max(...CATEGORY_AXIS.map((k) => countBy[k] ?? 0), 1);

  return (
    <div className={`${cardShell} flex min-h-[340px] flex-col px-8 py-7`}>
      <p className="text-sm font-semibold uppercase tracking-wide text-fg-strong/90">
        Scans by Attack Category
      </p>

      <div className="mt-6 flex flex-1 flex-col justify-end">
        <div className="flex h-[188px] items-end justify-between gap-6 px-1 pb-1">
          {CATEGORY_AXIS.map((key) => {
            const n = countBy[key] ?? 0;
            const h = Math.round((n / max) * 120);
            const barColor = key === 'jailbreak' ? 'rgba(148,163,184,0.45)' : '#22ffe9';
            return (
              <div key={key} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex h-[164px] w-full items-end justify-center">
                  <div
                    className="w-12 rounded-t-sm"
                    style={{ height: `${h}px`, backgroundColor: barColor, opacity: n === 0 ? 0 : 1 }}
                  />
                </div>
                <p className="mt-4 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-muted/70">
                  {CATEGORY_AXIS_LABEL[key]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RiskPanel({ byRisk }: { byRisk: { risk_level: string; count: number }[] }) {
  const total = byRisk.reduce((a, b) => a + b.count, 0);
  const high = byRisk.find((x) => x.risk_level === 'high')?.count ?? 0;
  const low = byRisk.find((x) => x.risk_level === 'low')?.count ?? 0;
  const highPct = total > 0 ? Math.round((high / total) * 100) : 0;
  const lowPct = total > 0 ? Math.round((low / total) * 100) : 0;

  return (
    <div className={`${cardShell} px-8 py-7`}>
      <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted/70">
        Risk Level Distribution
      </p>

      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-strong/90">High Risk</p>
            <p className="text-[12px] font-medium text-accent">{high}</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-accent/15">
            <div className="h-full rounded-full bg-accent" style={{ width: `${highPct}%` }} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-strong/90">Low Risk</p>
            <p className="text-[12px] font-medium text-fg-muted/90">{low}</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-white/[0.22]" style={{ width: `${lowPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CoveragePanel({ models, prompts, completed }: { models: number; prompts: number; completed: number }) {
  return (
    <div className={`${cardShell} border-l-[3px] border-l-accent px-8 py-7`}>
      <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted/70">
        Test Coverage
      </p>

      <div className="space-y-6 text-[13px]">
        <div className="flex items-center justify-between">
          <p className="font-medium text-fg-strong/90">Models Tested</p>
          <p className="font-medium text-accent">{models}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-medium text-fg-strong/90">Prompt Library</p>
          <p className="font-medium text-accent">{prompts}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-medium text-fg-strong/90">Completed Runs</p>
          <p className="font-medium text-accent">{completed}</p>
        </div>
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
    Promise.all([getStatsOverview(), getScans(), getPrompts(), getModels()])
      .then(([s, scans, p, m]) => {
        setStats(s);
        setRecentScans(scans.slice(0, 6));
        setPrompts(p);
        setModelsList(m);
      })
      .catch(() => {});
  }, []);

  return (
    <Page>
      <div className="flex flex-col gap-10">
        {/* KPI row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="TOTAL SCANS" value={stats?.total_scans ?? 0} icon={Zap} iconColor="#22ffe9" />
          <StatCard label="VULNERABILITIES" value={stats?.vulnerable ?? 0} icon={ShieldAlert} iconColor="rgba(248,113,113,0.65)" iconMuted />
          <StatCard label="SAFE RESULTS" value={stats?.safe ?? 0} icon={ShieldCheck} iconColor="#22ffe9" />
          <StatCard label="DETECTION RATE" value={`${stats?.detection_rate ?? 0}%`} />
        </div>

        {/* Chart + right column — ~70% main / stacked right */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <AttackCategoryPanel byCategory={stats?.by_category ?? []} />
          <div className="flex flex-col gap-6">
            <RiskPanel byRisk={stats?.by_risk ?? []} />
            <CoveragePanel models={modelsList.length} prompts={prompts.length} completed={stats?.completed ?? 0} />
          </div>
        </div>

        {/* Recent scans table */}
        <div className={`${cardShell} overflow-hidden`}>
          <div className="flex items-baseline justify-between border-b border-white/[0.04] px-7 py-5">
            <p className="text-sm font-semibold text-fg-strong/90">Recent Security Scans</p>
            <Link
              to="/reports"
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
            >
              Download full report
            </Link>
          </div>

          <div className="overflow-x-auto pb-8 pt-5">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-black/20">
                  {['Scan ID', 'Prompt', 'Category', 'Risk', 'Model', 'Status', 'Time'].map((h) => (
                    <th
                      key={h}
                      className={`px-7 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted/70 ${
                        h === 'Time' ? 'text-right' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}

                </tr>
              </thead>
              <tbody>
                {recentScans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-20 text-center text-sm text-fg-muted">
                      No scans yet. Run your first security scan to see results.
                    </td>
                  </tr>
                ) : (
                  recentScans.map((s) => {
                    const firstPid = s.prompt_id_list?.[0];
                    const p = firstPid != null ? prompts.find((x) => x.id === firstPid) : undefined;
                    const m = modelsList.find((x) => x.id === s.model_id);
                    const badge = CATEGORY_BADGE[p?.category || ''] ?? {
                      bg: 'rgba(148,163,184,0.12)',
                      fg: 'rgba(148,163,184,0.95)',
                      label: (p?.category || '').toUpperCase(),
                    };
                    const riskDot = p?.risk_level === 'high' ? '#22ffe9' : 'rgba(148,163,184,0.6)';

                    return (
                      <tr key={s.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                        <td className="align-middle px-7 py-3.5 text-xs font-medium text-accent">#SCN-{s.id}</td>
                        <td className="max-w-[320px] align-middle px-5 py-3.5">
                          <p className="truncate text-xs text-fg" title={p?.input_text}>
                            {p?.input_text || (firstPid != null ? `Prompt #${firstPid}` : '—')}
                          </p>
                        </td>
                        <td className="align-middle px-7 py-3.5">
                          {p && (
                            <span
                              className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                              style={{ backgroundColor: badge.bg, color: badge.fg }}
                            >
                              {badge.label}
                            </span>
                          )}
                        </td>
                        <td className="align-middle px-7 py-3.5">
                          {p && (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: riskDot }} />
                              <span className="text-xs text-fg-strong/90">{p.risk_level === 'high' ? 'High' : 'Low'}</span>
                            </div>
                          )}
                        </td>
                        <td className="align-middle px-7 py-3.5 text-xs text-fg-muted">{m?.name || `Model #${s.model_id}`}</td>
                        <td className="align-middle px-7 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                            <CheckCircle2 size={12} />
                            completed
                          </span>
                        </td>
                        <td className="align-middle px-7 py-3.5 text-right text-xs leading-none text-fg-muted tabular-nums">
                          {formatRelativeTime(s.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Page>
  );
}
