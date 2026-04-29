import { useEffect, useState, Fragment } from 'react';
import { getScans, createScan, getPrompts, getModels, getScanResults, startJob, streamJobResults } from '../api';
import type { TestRun, Prompt, Model, Result, StreamEvent } from '../api';
import { Plus, ChevronDown, ChevronRight, X, ShieldCheck, ShieldAlert, Zap, Activity, CheckCircle2, AlertTriangle, Key } from 'lucide-react';

const CATEGORY_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  prompt_injection: { bg: '#4c1d9540', text: '#c4b5fd', label: 'Prompt Injection' },
  jailbreak: { bg: '#7f1d1d40', text: '#fca5a5', label: 'Jailbreak' },
  data_exfiltration: { bg: '#78350f40', text: '#fcd34d', label: 'Data Exfiltration' },
  normal: { bg: '#1e3a2f40', text: '#6ee7b7', label: 'Baseline' },
};

const SEV_LABELS: Record<string, { color: string }> = {
  critical: { color: '#ef4444' },
  high: { color: '#f97316' },
  medium: { color: '#f59e0b' },
  low: { color: '#10b981' },
  none: { color: '#475569' },
};

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

  const load = () => Promise.all([getScans(), getPrompts(), getModels()])
    .then(([s, p, m]) => { setScans(s); setPrompts(p); setModelsList(m); });

  useEffect(() => { load(); }, []);

  const expand = async (id: number) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!results[id]) {
      const r = await getScanResults(id);
      setResults(prev => ({ ...prev, [id]: r }));
    }
  };

  const togglePrompt = (id: number) => {
    setForm(f => ({
      ...f,
      prompt_ids: f.prompt_ids.includes(id)
        ? f.prompt_ids.filter(p => p !== id)
        : [...f.prompt_ids, id]
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.prompt_ids.length === 0) return;
    setLoading(true);
    setStreamEvents([]);
    try {
      await createScan({ prompt_id_list: form.prompt_ids, model_id: Number(form.model_id) });
      load();

      const selectedModel = modelsList.find(m => m.id === Number(form.model_id));
      if (!selectedModel) return;

      const selectedPrompts = prompts.filter(p => form.prompt_ids.includes(p.id));

      const job = await startJob({
        prompt_list: selectedPrompts.map(p => ({
          input_text: p.input_text,
          category: p.category,
          risk_level: p.risk_level,
          created_by: p.created_by ?? 1,
          acceptance_criteria: p.acceptance_criteria ?? '',
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
      });

      setShowForm(false);
      setForm({ prompt_ids: [], model_id: '', api_key: '' });
      setStreaming(true);

      streamJobResults(
        job.job_id,
        (event) => setStreamEvents(prev => [...prev, event]),
        () => { setStreaming(false); load(); },
        () => setStreaming(false)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-indigo-400" />
            <h1 className="text-xl font-semibold" style={{ color: '#e2e8f0' }}>Security Scans</h1>
          </div>
          <p className="text-sm" style={{ color: '#475569' }}>Initiate and manage LLM vulnerability test runs</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
          <Plus size={14} /> New Scan
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Scans', value: scans.length, icon: Activity, color: '#6366f1' },
          { label: 'Completed', value: scans.filter(s => s.run_status === 'completed').length, icon: CheckCircle2, color: '#10b981' },
          { label: 'Pending', value: scans.filter(s => s.run_status === 'pending').length, icon: AlertTriangle, color: '#f59e0b' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border p-4 flex items-center gap-3" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>{value}</p>
              <p className="text-xs" style={{ color: '#475569' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Streaming results panel */}
      {(streaming || streamEvents.length > 0) && (
        <div className="rounded-xl border p-5 mb-6" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
          <div className="flex items-center gap-2 mb-3">
            {streaming
              ? <Activity size={14} className="text-indigo-400 animate-spin" />
              : <CheckCircle2 size={14} className="text-emerald-400" />}
            <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
              {streaming ? 'Scan running...' : 'Scan complete'}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {streamEvents.map((ev, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: '#1e2236', backgroundColor: '#0b0d14' }}>
                {ev.error
                  ? <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                  : ev.vulnerability_detected
                    ? <ShieldAlert size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                    : <ShieldCheck size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />}
                <p className="text-xs" style={{ color: '#94a3b8' }}>
                  {ev.error ?? ev.response ?? '—'}
                </p>
                {!ev.error && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${ev.vulnerability_detected ? 'bg-red-900/50 text-red-300' : 'bg-emerald-900/50 text-emerald-300'}`}>
                    {ev.vulnerability_detected ? 'Vulnerable' : 'Safe'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Scan modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-xl border w-full max-w-lg p-6" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Initiate Security Scan</h2>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Select prompts and a target model</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-white/5">
                <X size={16} style={{ color: '#64748b' }} />
              </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                  Test Prompts <span style={{ color: '#475569' }}>({form.prompt_ids.length} selected)</span>
                </label>
                <div className="max-h-40 overflow-y-auto rounded-lg border" style={{ borderColor: '#1e2236', backgroundColor: '#0b0d14' }}>
                  {prompts.map(p => (
                    <label key={p.id} className="flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-white/5">
                      <input type="checkbox" checked={form.prompt_ids.includes(p.id)}
                        onChange={() => togglePrompt(p.id)}
                        className="mt-0.5 accent-indigo-500 flex-shrink-0" />
                      <span className="text-xs" style={{ color: '#94a3b8' }}>
                        {p.input_text.slice(0, 70)}{p.input_text.length > 70 ? '…' : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Target Model</label>
                <select required value={form.model_id} onChange={e => setForm(f => ({ ...f, model_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}>
                  <option value="">Select a model...</option>
                  {modelsList.map(m => <option key={m.id} value={m.id}>{m.name} — {m.provider} ({m.access_method})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                  <span className="flex items-center gap-1"><Key size={10} /> API Key</span>
                </label>
                <input type="password" value={form.api_key}
                  onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}
                  placeholder="sk-... (leave blank to use stored credential)" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm border transition-colors"
                  style={{ borderColor: '#1e2236', color: '#64748b' }}>Cancel</button>
                <button type="submit" disabled={loading || form.prompt_ids.length === 0 || !form.model_id}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Activity size={14} className="animate-spin" /> : <Zap size={14} />}
                  {loading ? 'Starting...' : 'Start Scan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scans table */}
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #1e2236' }}>
              {['', 'ID', 'Prompts', 'Model', 'Status', 'Time'].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scans.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center" style={{ color: '#475569' }}>
                <Zap size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No scans yet. Click "New Scan" to begin testing.</p>
              </td></tr>
            ) : scans.map(s => {
              const m = modelsList.find(x => x.id === s.model_id);
              const scanPrompts = prompts.filter(p => s.prompt_id_list?.includes(p.id));
              return (
                <Fragment key={s.id}>
                  <tr style={{ borderBottom: expanded === s.id ? 'none' : '1px solid #1e2236' }}>
                    <td className="px-4 py-3 w-8">
                      <button onClick={() => expand(s.id)} className="text-slate-500 hover:text-slate-300 transition-colors">
                        {expanded === s.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#475569' }}>#{s.id}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>
                      {scanPrompts.length > 0
                        ? `${scanPrompts.length} prompt${scanPrompts.length > 1 ? 's' : ''}`
                        : `${s.prompt_id_list?.length ?? 0} prompt(s)`}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>{m?.name || `#${s.model_id}`}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.run_status === 'completed' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-amber-900/40 text-amber-300'
                      }`}>
                        {s.run_status === 'completed' ? <CheckCircle2 size={10} /> : <Activity size={10} />}
                        {s.run_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>
                      {s.created_at ? new Date(s.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                  {expanded === s.id && (
                    <tr style={{ borderBottom: '1px solid #1e2236', backgroundColor: '#0d0f1a' }}>
                      <td colSpan={6} className="px-8 py-5">
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Prompts</p>
                        <div className="flex flex-col gap-1 mb-4">
                          {scanPrompts.map(p => (
                            <p key={p.id} className="text-xs p-2 rounded border" style={{ color: '#94a3b8', borderColor: '#1e2236', backgroundColor: '#10121c' }}>
                              {p.input_text}
                            </p>
                          ))}
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Results</p>
                        {(!results[s.id] || results[s.id].length === 0) ? (
                          <p className="text-xs" style={{ color: '#475569' }}>No results recorded yet.</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {results[s.id].map(r => (
                              <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: '#1e2236', backgroundColor: '#10121c' }}>
                                <div className="mt-0.5 flex-shrink-0">
                                  {r.vulnerability_detected
                                    ? <ShieldAlert size={16} className="text-red-400" />
                                    : <ShieldCheck size={16} className="text-emerald-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm" style={{ color: '#e2e8f0' }}>{r.output_text || '—'}</p>
                                  {r.notes && <p className="text-xs mt-1" style={{ color: '#64748b' }}>{r.notes}</p>}
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${r.vulnerability_detected ? 'bg-red-900/50 text-red-300' : 'bg-emerald-900/50 text-emerald-300'}`}>
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
