import { useEffect, useMemo, useState } from 'react';
import { getAllResults, getScans, getPrompts, getModels } from '../api';
import type { Result, TestRun, Prompt, Model } from '../api';
import { FileBarChart2, ShieldAlert, ShieldCheck, Download, Filter, CheckCircle2, Activity } from 'lucide-react';
import { Page, PageHeader } from '../ui/page';
import { SURFACE_CARD } from '../ui/surfaces';

const cardShell = SURFACE_CARD;

const SEV_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: '#450a0a', text: '#fca5a5', border: '#dc2626' },
  high: { bg: '#431407', text: '#fdba74', border: '#ea580c' },
  medium: { bg: '#422006', text: '#fcd34d', border: '#d97706' },
  low: { bg: '#052e16', text: '#86efac', border: '#16a34a' },
  none: { bg: '#0f172a', text: '#94a3b8', border: '#334155' },
};

const CAT_CONFIG: Record<string, { label: string; color: string }> = {
  prompt_injection: { label: 'PROMPT INJECTION', color: '#22ffe9' },
  jailbreak: { label: 'JAILBREAK', color: 'rgba(148,163,184,0.9)' },
  data_exfiltration: { label: 'DATA EXFILTRATION', color: '#22ffe9' },
  normal: { label: 'BASELINE', color: '#22ffe9' },
};

type FilterKey = 'all' | 'vulnerable' | 'safe';

export default function Reports() {
  const [results, setResults] = useState<Result[]>([]);
  const [scans, setScans] = useState<TestRun[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [modelsList, setModelsList] = useState<Model[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllResults(), getScans(), getPrompts(), getModels()])
      .then(([r, s, p, m]) => {
        setResults(r);
        setScans(s);
        setPrompts(p);
        setModelsList(m);
      })
      .finally(() => setLoading(false));
  }, []);

  const enriched = useMemo(() => {
    return results.map((r) => {
      const scan = scans.find((s) => s.id === r.test_run_id);
      const firstPid = scan?.prompt_id_list?.[0];
      const prompt = firstPid != null ? prompts.find((p) => p.id === firstPid) : undefined;
      const model = modelsList.find((m) => m.id === scan?.model_id);
      return { result: r, scan, prompt, model };
    });
  }, [results, scans, prompts, modelsList]);

  const filtered = useMemo(() => {
    return enriched.filter(({ result, prompt }) => {
      const vulnOk =
        filter === 'all' ||
        (filter === 'vulnerable' && result.vulnerability_detected) ||
        (filter === 'safe' && !result.vulnerability_detected);
      const catOk = catFilter === 'all' || prompt?.category === catFilter;
      return vulnOk && catOk;
    });
  }, [enriched, filter, catFilter]);

  const vulnCount = results.filter((r) => r.vulnerability_detected).length;
  const safeCount = results.filter((r) => !r.vulnerability_detected).length;

  const exportJSON = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          filtered.map((e) => ({
            result_id: e.result.id,
            scan_id: e.result.test_run_id,
            model: e.model?.name,
            prompt: e.prompt?.input_text,
            category: e.prompt?.category,
            risk_level: e.prompt?.risk_level,
            output: e.result.output_text,
            vulnerability_detected: e.result.vulnerability_detected,
            severity: e.result.severity,
            notes: e.result.notes,
          })),
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vulnerability-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = Array.from(new Set(prompts.map((p) => p.category))).sort();

  return (
    <Page>
      <PageHeader
        title="Reports"
        description="Review scan evaluation findings — filter, triage, and export."
        actions={
          <button
            type="button"
            onClick={exportJSON}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-surface-raised px-3 py-2 text-xs font-medium text-fg-muted transition-colors hover:bg-white/[0.04] hover:text-fg-strong"
          >
            <Download size={14} />
            Export JSON
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className={`${cardShell} flex h-[112px] flex-col justify-center px-8 py-4`}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted/70">
            Total Findings
          </p>
          <div className="flex items-end gap-2">
            <p className="font-heading text-[34px] font-semibold leading-none tracking-tight text-fg-strong">
              {results.length}
            </p>
            <FileBarChart2 size={14} className="text-fg-muted/80" />
          </div>
        </div>
        <div className={`${cardShell} flex h-[112px] flex-col justify-center px-8 py-4`}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted/70">
            Vulnerabilities
          </p>
          <div className="flex items-end gap-2">
            <p className="font-heading text-[34px] font-semibold leading-none tracking-tight text-fg-strong">
              {vulnCount}
            </p>
            <ShieldAlert size={14} className="text-red-400/80" />
          </div>
        </div>
        <div className={`${cardShell} flex h-[112px] flex-col justify-center px-8 py-4`}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted/70">
            Safe Results
          </p>
          <div className="flex items-end gap-2">
            <p className="font-heading text-[34px] font-semibold leading-none tracking-tight text-fg-strong">
              {safeCount}
            </p>
            <ShieldCheck size={14} className="text-emerald-400/80" />
          </div>
        </div>
      </div>

      <div className={`${cardShell} overflow-hidden`}>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] bg-surface-raised/30 px-6 py-3">
          <div className="flex items-center gap-1.5 text-xs text-fg-muted">
            <Filter size={12} className="opacity-80" />
            <span className="font-medium">Filters</span>
          </div>

          <div className="ml-1 flex items-center gap-2">
            {(['all', 'vulnerable', 'safe'] as FilterKey[]).map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    active
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-white/[0.12] text-fg-muted hover:bg-white/[0.04] hover:text-fg-strong'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-white/[0.08]" />

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-lg border border-white/[0.12] bg-surface-raised px-3 py-1.5 text-xs text-fg-muted outline-none focus:border-accent/35"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {CAT_CONFIG[c]?.label || c}
              </option>
            ))}
          </select>

          <span className="ml-auto text-xs text-fg-muted">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-6 py-10 text-sm text-fg-muted">
            <Activity size={14} className="animate-spin text-accent" />
            Loading reports…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <FileBarChart2 size={28} className="mx-auto mb-3 text-fg-muted/40" />
            <p className="text-sm text-fg-muted">No results match the current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filtered.map(({ result, scan, prompt, model }) => {
              const sev = SEV_CONFIG[result.severity || 'none'] || SEV_CONFIG.none;
              const cat = CAT_CONFIG[prompt?.category || ''] || { label: (prompt?.category || 'UNKNOWN').toUpperCase(), color: '#22ffe9' };
              const vuln = result.vulnerability_detected;

              return (
                <div key={result.id} className="px-6 py-5 hover:bg-white/[0.02]">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 shrink-0">
                      {vuln ? (
                        <ShieldAlert size={16} className="text-red-400" />
                      ) : (
                        <ShieldCheck size={16} className="text-emerald-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-accent">#SCN-{scan?.id ?? result.test_run_id}</span>
                        <span
                          className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                          style={{ backgroundColor: `${cat.color}1f`, color: cat.color }}
                        >
                          {cat.label}
                        </span>
                        {prompt?.risk_level && (
                          <span className="text-xs text-fg-muted">
                            Risk: <span className="text-fg-strong/90">{prompt.risk_level}</span>
                          </span>
                        )}
                        <span className="text-xs text-fg-muted">
                          Model: <span className="text-fg-strong/90">{model?.name || 'Unknown'}</span>
                        </span>
                      </div>

                      {prompt?.input_text && (
                        <div className="mb-2 rounded-xl border border-white/[0.06] bg-surface-raised/40 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted/70">
                            Prompt
                          </p>
                          <p className="mt-1 text-xs text-fg">{prompt.input_text}</p>
                        </div>
                      )}

                      <div className="rounded-xl border border-white/[0.06] bg-surface-raised/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted/70">
                          Response
                        </p>
                        <p className="mt-1 text-xs text-fg">{result.output_text || '—'}</p>
                      </div>

                      {result.notes && <p className="mt-2 text-xs text-fg-muted">{result.notes}</p>}
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          vuln ? 'bg-red-900/40 text-red-300' : 'bg-emerald-900/35 text-emerald-300'
                        }`}
                      >
                        {vuln ? <ShieldAlert size={12} /> : <CheckCircle2 size={12} />}
                        {vuln ? 'VULNERABLE' : 'SAFE'}
                      </span>

                      {result.severity && result.severity !== 'none' && (
                        <div className="mt-2">
                          <span
                            className="inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                            style={{
                              backgroundColor: sev.bg,
                              color: sev.text,
                              borderColor: `${sev.border}60`,
                            }}
                          >
                            {result.severity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
}
