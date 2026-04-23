import { useEffect, useMemo, useState, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getScans, createScan, getPrompts, getModels, getScanResults, startJob, streamJobResults } from '../api';
import type { TestRun, Prompt, Model, Result, StreamEvent } from '../api';
import {
  Plus, ChevronDown, ChevronRight, X, ShieldCheck, ShieldAlert, Zap, Activity, CheckCircle2, AlertTriangle, Key,
  Filter, Download,
} from 'lucide-react';
import { Page, PageHeader } from '../ui/page';
import { SURFACE_PANEL_LG } from '../ui/surfaces';

const shell = SURFACE_PANEL_LG;

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  return new Date(iso).toLocaleString();
}

function escapeCsvCell(v: unknown): string {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function statusPill(status: string): { label: string; className: string } {
  if (status === 'completed') {
    return { label: 'COMPLETED', className: 'bg-emerald-900/45 text-emerald-300 ring-1 ring-emerald-500/20' };
  }
  if (status === 'pending') {
    return { label: 'RUNNING', className: 'bg-blue-900/40 text-blue-300 ring-1 ring-blue-500/20' };
  }
  return {
    label: status.replace(/_/g, ' ').toUpperCase(),
    className: 'bg-surface-raised text-fg-muted ring-1 ring-white/[0.08]',
  };
}

function riskScoreFromResults(list: Result[] | undefined): number | null {
  if (!list?.length) return null;
  const vuln = list.filter((x) => x.vulnerability_detected).length;
  return Math.min(100, Math.round((vuln / list.length) * 100));
}

export default function Scans() {
  const [scans, setScans] = useState<TestRun[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [modelsList, setModelsList] = useState<Model[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ prompt_ids: [] as number[], model_id: '', api_key: '' });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, Result[]>>({});
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const load = () =>
    Promise.all([getScans(), getPrompts(), getModels()]).then(([s, p, m]) => {
      setScans(s);
      setPrompts(p);
      setModelsList(m);
    });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    setShowForm(true);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const filteredScans = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return scans;
    return scans.filter((s) => {
      const m = modelsList.find((x) => x.id === s.model_id);
      return (
        String(s.id).includes(q) ||
        `scn-${s.id}`.includes(q) ||
        (m?.name || '').toLowerCase().includes(q) ||
        (m?.provider || '').toLowerCase().includes(q)
      );
    });
  }, [scans, filterQuery, modelsList]);

  const exportCsv = () => {
    const header = ['operation_id', 'target_asset', 'status', 'risk_score', 'execution_time'].map(escapeCsvCell).join(',');
    const lines = filteredScans.map((s) => {
      const m = modelsList.find((x) => x.id === s.model_id);
      const score = riskScoreFromResults(results[s.id]);
      return [
        escapeCsvCell(`SCN-${s.id}`),
        escapeCsvCell(m?.name || s.model_id),
        escapeCsvCell(s.run_status),
        escapeCsvCell(score ?? ''),
        escapeCsvCell(s.created_at || ''),
      ].join(',');
    });
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scan-operations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const expand = async (id: number) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!results[id]) {
      const r = await getScanResults(id);
      setResults((prev) => ({ ...prev, [id]: r }));
    }
  };

  const togglePrompt = (id: number) => {
    setForm((f) => ({
      ...f,
      prompt_ids: f.prompt_ids.includes(id) ? f.prompt_ids.filter((p) => p !== id) : [...f.prompt_ids, id],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.prompt_ids.length === 0) return;
    setLoading(true);
    setStreamEvents([]);
    try {
      const scan = await createScan({ prompt_id_list: form.prompt_ids, model_id: Number(form.model_id) });
      load();

      const selectedModel = modelsList.find((m) => m.id === Number(form.model_id));
      if (!selectedModel) return;

      const selectedPrompts = prompts.filter((p) => form.prompt_ids.includes(p.id));

      const job = await startJob({
        prompt_list: selectedPrompts.map((p) => ({
          input_text: p.input_text,
          category: p.category,
          risk_level: p.risk_level,
          created_by: p.created_by ?? 1,
          acceptance_criteria: p.acceptance_criteria ?? '',
          prompt_id: p.id,
        })),
        model: {
          name: selectedModel.name,
          provider: selectedModel.provider,
          model_type: selectedModel.model_type,
          access_method: selectedModel.access_method,
          acceptance_criteria: '',
          credential_reference: form.api_key || selectedModel.credential_reference,
          access_url: selectedModel.access_url,
          browser_textbox: selectedModel.browser_textbox,
          login_info: [],
        },
        scan_id: scan.id,
      });

      setShowForm(false);
      setForm({ prompt_ids: [], model_id: '', api_key: '' });
      setStreaming(true);

      streamJobResults(
        job.job_id,
        (event) => setStreamEvents((prev) => [...prev, event]),
        () => {
          setStreaming(false);
          load();
        },
        () => setStreaming(false)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Security Scans"
        description="Run security scans against registered models and track results over time."
      />
      {(streaming || streamEvents.length > 0) && (
        <div className={`${shell} mb-6 p-5`}>
          <div className="mb-3 flex items-center gap-2">
            {streaming ? (
              <Activity size={14} className="animate-spin text-accent" />
            ) : (
              <CheckCircle2 size={14} className="text-emerald-400" />
            )}
            <p className="text-sm font-semibold text-fg-strong">
              {streaming ? 'Scan running...' : 'Scan complete'}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {streamEvents.map((ev, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-surface-raised/80 p-3"
              >
                {ev.error ? (
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
                ) : ev.vulnerability_detected ? (
                  <ShieldAlert size={14} className="mt-0.5 shrink-0 text-red-400" />
                ) : (
                  <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                )}
                <p className="text-xs text-fg">{ev.error ?? ev.response ?? '—'}</p>
                {!ev.error && (
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      ev.vulnerability_detected ? 'bg-red-900/50 text-red-300' : 'bg-emerald-900/50 text-emerald-300'
                    }`}
                  >
                    {ev.vulnerability_detected ? 'Vulnerable' : 'Safe'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`w-full max-w-lg ${shell} p-6`}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-heading font-semibold text-fg-strong">Initiate Security Scan</h2>
                <p className="mt-0.5 text-xs text-fg-muted">Select prompts and a target model</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-fg-muted hover:bg-white/[0.06]">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                  Test Prompts <span className="text-fg-muted/70">({form.prompt_ids.length} selected)</span>
                </label>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-white/[0.08] bg-surface-raised">
                  {prompts.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-white/[0.04]">
                      <input
                        type="checkbox"
                        checked={form.prompt_ids.includes(p.id)}
                        onChange={() => togglePrompt(p.id)}
                        className="mt-0.5 shrink-0 accent-[#22ffe9]"
                      />
                      <span className="text-xs text-fg">
                        {p.input_text.slice(0, 70)}
                        {p.input_text.length > 70 ? '…' : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-muted">Target Model</label>
                <select
                  required
                  value={form.model_id}
                  onChange={(e) => setForm((f) => ({ ...f, model_id: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-surface-raised px-3 py-2 text-sm text-fg outline-none focus:border-accent/40"
                >
                  <option value="">Select a model...</option>
                  {modelsList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.provider} ({m.access_method})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-fg-muted">
                  <Key size={10} /> API Key
                </label>
                <input
                  type="password"
                  value={form.api_key}
                  onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-surface-raised px-3 py-2 text-sm text-fg outline-none focus:border-accent/40"
                  placeholder="sk-... (leave blank to use stored credential)"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm text-fg-muted transition-colors hover:bg-white/[0.04]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || form.prompt_ids.length === 0 || !form.model_id}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-surface-void transition-colors hover:bg-accent/90 disabled:opacity-50"
                >
                  {loading ? <Activity size={14} className="animate-spin" /> : <Zap size={14} />}
                  {loading ? 'Starting...' : 'Start Scan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`overflow-hidden ${shell}`}>
        <div className="flex flex-col gap-4 border-b border-white/[0.06] bg-surface-raised/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <h2 className="font-heading text-base font-semibold text-fg-strong">Recent Operations</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/15"
            >
              <Plus size={14} strokeWidth={2.5} />
              New Scan
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                filterOpen || filterQuery
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-white/[0.12] text-fg-muted hover:bg-white/[0.04] hover:text-fg-strong'
              }`}
            >
              <Filter size={14} />
              Filter
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={filteredScans.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] px-3 py-2 text-xs font-medium text-fg-muted transition-colors hover:bg-white/[0.04] hover:text-fg-strong disabled:opacity-40"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {filterOpen && (
          <div className="border-b border-white/[0.06] bg-black/20 px-5 py-3 lg:px-6">
            <input
              type="search"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter by operation ID or target model..."
              className="w-full max-w-md rounded-lg border border-white/[0.1] bg-surface-raised px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-accent/35"
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-black/25">
                {['', 'Operation ID', 'Target asset', 'Status', 'Risk score', 'Execution time', 'Actions'].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-fg-muted lg:px-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredScans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-fg-muted">
                    <Zap size={28} className="mx-auto mb-3 text-accent/30" />
                    <p className="text-sm">
                      {scans.length === 0
                        ? 'No scans yet. Use New Scan to begin testing.'
                        : 'No operations match this filter. Clear the filter or try different keywords.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredScans.map((s) => {
                  const m = modelsList.find((x) => x.id === s.model_id);
                  const scanPrompts = prompts.filter((p) => s.prompt_id_list?.includes(p.id));
                  const score = riskScoreFromResults(results[s.id]);
                  const pill = statusPill(s.run_status);
                  const barColor =
                    score == null ? 'bg-white/[0.08]' : score >= 70 ? 'bg-red-500/80' : score >= 40 ? 'bg-amber-500/80' : 'bg-emerald-500/70';

                  return (
                    <Fragment key={s.id}>
                      <tr className="border-b border-white/[0.05] transition-colors hover:bg-white/[0.02]">
                        <td className="w-10 px-2 py-3 lg:px-3">
                          <button
                            type="button"
                            onClick={() => expand(s.id)}
                            className="rounded p-1 text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg-strong"
                            aria-expanded={expanded === s.id}
                          >
                            {expanded === s.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td className="px-3 py-3 lg:px-5">
                          <p className="font-mono text-sm font-medium text-accent">SCN-{s.id}</p>
                          <p className="mt-0.5 text-[11px] text-fg-muted">
                            {s.created_at ? new Date(s.created_at).toLocaleString() : '—'}
                          </p>
                        </td>
                        <td className="max-w-[220px] px-3 py-3 text-xs text-fg lg:px-5">
                          <span className="truncate font-medium" title={m?.name}>
                            {m?.name || `model-${s.model_id}`}
                          </span>
                          {m?.provider && <p className="mt-0.5 text-[11px] text-fg-muted">{m.provider}</p>}
                        </td>
                        <td className="px-3 py-3 lg:px-5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${pill.className}`}>
                            {s.run_status === 'completed' && <CheckCircle2 size={11} />}
                            {s.run_status === 'pending' && <Activity size={11} className="animate-pulse" />}
                            {pill.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 lg:px-5">
                          <div className="flex max-w-[140px] items-center gap-2">
                            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-fg-muted">
                              {score != null ? `${score}/100` : '—'}
                            </span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/[0.06]">
                              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: score != null ? `${score}%` : '0%' }} />
                            </div>
                          </div>
                          {score == null && results[s.id]?.length === 0 && expanded === s.id && (
                            <p className="mt-1 text-[10px] text-fg-muted">No result rows yet</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-fg-muted lg:px-5">
                          {s.run_status === 'pending' ? 'Running…' : formatRelativeTime(s.created_at)}
                        </td>
                        <td className="px-3 py-3 text-fg-muted lg:px-5" />
                      </tr>
                      {expanded === s.id && (
                        <tr className="border-b border-white/[0.06] bg-surface-raised/50">
                          <td colSpan={7} className="px-6 py-5 lg:px-8">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">Prompts</p>
                            <div className="mb-4 flex flex-col gap-1">
                              {scanPrompts.map((p) => (
                                <p
                                  key={p.id}
                                  className="rounded-lg border border-white/[0.06] bg-surface-panel p-2 text-xs text-fg"
                                >
                                  {p.input_text}
                                </p>
                              ))}
                            </div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">Results</p>
                            {!results[s.id] || results[s.id].length === 0 ? (
                              <p className="text-xs text-fg-muted">No results recorded yet.</p>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {results[s.id].map((r) => (
                                  <div
                                    key={r.id}
                                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-surface-panel p-3"
                                  >
                                    <div className="mt-0.5 shrink-0">
                                      {r.vulnerability_detected ? (
                                        <ShieldAlert size={16} className="text-red-400" />
                                      ) : (
                                        <ShieldCheck size={16} className="text-emerald-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm text-fg-strong">{r.output_text || '—'}</p>
                                      {r.notes && <p className="mt-1 text-xs text-fg-muted">{r.notes}</p>}
                                    </div>
                                    <span
                                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                        r.vulnerability_detected ? 'bg-red-900/50 text-red-300' : 'bg-emerald-900/50 text-emerald-300'
                                      }`}
                                    >
                                      {r.vulnerability_detected ? 'Vulnerable' : 'Safe'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/[0.06] bg-black/20 px-5 py-3 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p>
            Showing{' '}
            {filteredScans.length === 0 ? '0' : `1–${filteredScans.length}`} of {scans.length} scan operations
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="rounded border border-white/[0.08] px-2.5 py-1 text-fg-muted opacity-40"
            >
              Previous
            </button>
            <span className="rounded border border-accent/30 bg-accent/10 px-2.5 py-1 font-medium text-accent">1</span>
            <button type="button" disabled className="rounded border border-white/[0.08] px-2.5 py-1 text-fg-muted opacity-40">
              Next
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}
