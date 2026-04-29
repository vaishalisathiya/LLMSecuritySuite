import { useEffect, useState } from 'react';
import { getAllResults, getScans, getPrompts, getModels } from '../api';
import type { Result, TestRun, Prompt, Model } from '../api';
import { FileBarChart2, ShieldAlert, ShieldCheck, Download, Filter } from 'lucide-react';

const SEV_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: '#450a0a', text: '#fca5a5', border: '#dc2626' },
  high: { bg: '#431407', text: '#fdba74', border: '#ea580c' },
  medium: { bg: '#422006', text: '#fcd34d', border: '#d97706' },
  low: { bg: '#052e16', text: '#86efac', border: '#16a34a' },
  none: { bg: '#0f172a', text: '#94a3b8', border: '#334155' },
};

const CAT_CONFIG: Record<string, { label: string; color: string }> = {
  prompt_injection: { label: 'Prompt Injection', color: '#8b5cf6' },
  jailbreak: { label: 'Jailbreak', color: '#ef4444' },
  data_exfiltration: { label: 'Data Exfiltration', color: '#f59e0b' },
  normal: { label: 'Baseline', color: '#10b981' },
};

type FilterKey = 'all' | 'vulnerable' | 'safe';

export default function Reports() {
  const [results, setResults] = useState<Result[]>([]);
  const [scans, setScans] = useState<TestRun[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [modelsList, setModelsList] = useState<Model[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [catFilter, setCatFilter] = useState<string>('all');

  useEffect(() => {
    Promise.all([getAllResults(), getScans(), getPrompts(), getModels()])
      .then(([r, s, p, m]) => { setResults(r); setScans(s); setPrompts(p); setModelsList(m); });
  }, []);

  const enrich = (r: Result) => {
    const scan = scans.find(s => s.id === r.test_run_id);
    const prompt = prompts.find(p => p.id === scan?.prompt_id);
    const model = modelsList.find(m => m.id === scan?.model_id);
    return { result: r, scan, prompt, model };
  };

  const enriched = results.map(enrich);

  const filtered = enriched.filter(({ result, prompt }) => {
    const vulnOk = filter === 'all' || (filter === 'vulnerable' && result.vulnerability_detected) || (filter === 'safe' && !result.vulnerability_detected);
    const catOk = catFilter === 'all' || prompt?.category === catFilter;
    return vulnOk && catOk;
  });

  const vulnCount = results.filter(r => r.vulnerability_detected).length;
  const safeCount = results.filter(r => !r.vulnerability_detected).length;

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered.map(e => ({
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
    })), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vulnerability-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = Array.from(new Set(prompts.map(p => p.category)));

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileBarChart2 size={16} className="text-indigo-400" />
            <h1 className="text-xl font-semibold" style={{ color: '#e2e8f0' }}>Vulnerability Reports</h1>
          </div>
          <p className="text-sm" style={{ color: '#475569' }}>All scan evaluation findings — filter, review, and export</p>
        </div>
        <button onClick={exportJSON}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          style={{ borderColor: '#1e2236', color: '#94a3b8', backgroundColor: '#10121c' }}>
          <Download size={14} /> Export JSON
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border p-4 flex items-center gap-3" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
          <div className="p-2.5 rounded-lg bg-slate-700/50"><FileBarChart2 size={16} className="text-slate-400" /></div>
          <div><p className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>{results.length}</p>
            <p className="text-xs" style={{ color: '#475569' }}>Total Findings</p></div>
        </div>
        <div className="rounded-xl border p-4 flex items-center gap-3" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
          <div className="p-2.5 rounded-lg bg-red-900/30"><ShieldAlert size={16} className="text-red-400" /></div>
          <div><p className="text-2xl font-bold text-red-400">{vulnCount}</p>
            <p className="text-xs" style={{ color: '#475569' }}>Vulnerabilities</p></div>
        </div>
        <div className="rounded-xl border p-4 flex items-center gap-3" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
          <div className="p-2.5 rounded-lg bg-emerald-900/30"><ShieldCheck size={16} className="text-emerald-400" /></div>
          <div><p className="text-2xl font-bold text-emerald-400">{safeCount}</p>
            <p className="text-xs" style={{ color: '#475569' }}>Safe Results</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5">
          <Filter size={12} style={{ color: '#475569' }} />
          <span className="text-xs" style={{ color: '#475569' }}>Filter:</span>
        </div>
        {(['all', 'vulnerable', 'safe'] as FilterKey[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 border'}`}
            style={filter !== f ? { borderColor: '#1e2236', backgroundColor: '#10121c' } : {}}>
            {f}
          </button>
        ))}
        <div className="w-px h-4 mx-1" style={{ backgroundColor: '#1e2236' }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border outline-none"
          style={{ backgroundColor: '#10121c', borderColor: '#1e2236', color: '#94a3b8' }}>
          <option value="all">All categories</option>
          {categories.map(c => <option key={c} value={c}>{CAT_CONFIG[c]?.label || c}</option>)}
        </select>
        <span className="text-xs ml-auto" style={{ color: '#475569' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
          <FileBarChart2 size={32} className="mx-auto mb-3 opacity-20" style={{ color: '#94a3b8' }} />
          <p className="text-sm" style={{ color: '#475569' }}>No results match the current filters</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(({ result, scan, prompt, model }) => {
            const sev = SEV_CONFIG[result.severity || 'none'] || SEV_CONFIG.none;
            const cat = CAT_CONFIG[prompt?.category || ''] || { label: prompt?.category || '', color: '#6366f1' };
            return (
              <div key={result.id} className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: '#10121c', borderColor: result.vulnerability_detected ? '#dc262640' : '#1e2236' }}>
                <div className="flex items-start gap-4 p-4">
                  <div className="mt-0.5 flex-shrink-0">
                    {result.vulnerability_detected
                      ? <div className="w-8 h-8 rounded-lg bg-red-900/40 flex items-center justify-center"><ShieldAlert size={15} className="text-red-400" /></div>
                      : <div className="w-8 h-8 rounded-lg bg-emerald-900/30 flex items-center justify-center"><ShieldCheck size={15} className="text-emerald-400" /></div>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs font-mono" style={{ color: '#475569' }}>Scan #{scan?.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>{cat.label}</span>
                      {prompt?.risk_level && (
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          prompt.risk_level === 'high' ? 'bg-red-900/40 text-red-300' :
                          prompt.risk_level === 'medium' ? 'bg-amber-900/40 text-amber-300' :
                          'bg-emerald-900/40 text-emerald-300'
                        }`}>{prompt.risk_level} risk</span>
                      )}
                      <span className="text-xs" style={{ color: '#475569' }}>→ {model?.name || 'Unknown model'}</span>
                    </div>

                    {prompt?.input_text && (
                      <div className="mb-2 p-2.5 rounded-lg text-xs border" style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#64748b' }}>
                        <span style={{ color: '#475569' }}>Prompt: </span>{prompt.input_text}
                      </div>
                    )}

                    {result.output_text && (
                      <div className="p-2.5 rounded-lg text-xs border" style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#94a3b8' }}>
                        <span style={{ color: '#475569' }}>Response: </span>{result.output_text}
                      </div>
                    )}

                    {result.notes && (
                      <p className="text-xs mt-2" style={{ color: '#64748b' }}>
                        <span style={{ color: '#475569' }}>Note: </span>{result.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${result.vulnerability_detected ? 'bg-red-900/50 text-red-300' : 'bg-emerald-900/40 text-emerald-300'}`}>
                      {result.vulnerability_detected ? 'VULNERABLE' : 'SAFE'}
                    </span>
                    {result.severity && result.severity !== 'none' && (
                      <span className="px-2.5 py-1 rounded-lg text-xs uppercase font-semibold border"
                        style={{ backgroundColor: sev.bg, color: sev.text, borderColor: `${sev.border}60` }}>
                        {result.severity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
