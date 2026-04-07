import { useEffect, useState } from 'react';
import { getPrompts, createPrompt, getUsers } from '../api';
import type { Prompt, User } from '../api';
import { Plus, FileText, X, AlertTriangle, Shield, Database, CheckCircle } from 'lucide-react';

const CATEGORIES = ['prompt_injection', 'jailbreak', 'data_exfiltration', 'normal'];
const RISK_LEVELS = ['low', 'medium', 'high'];

const CAT_CONFIG: Record<string, { icon: React.FC<{ size?: number; className?: string }>; label: string; bg: string; text: string; description: string }> = {
  prompt_injection: { icon: Shield, label: 'Prompt Injection', bg: '#4c1d9530', text: '#c4b5fd', description: 'Attempts to override system instructions' },
  jailbreak: { icon: AlertTriangle, label: 'Jailbreak', bg: '#7f1d1d30', text: '#fca5a5', description: 'Bypasses safety guardrails' },
  data_exfiltration: { icon: Database, label: 'Data Exfiltration', bg: '#78350f30', text: '#fcd34d', description: 'Extracts sensitive system data' },
  normal: { icon: CheckCircle, label: 'Baseline', bg: '#1e3a2f30', text: '#6ee7b7', description: 'Control / non-adversarial inputs' },
};

export default function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ input_text: '', category: 'normal', risk_level: 'low', created_by: '' });
  const [loading, setLoading] = useState(false);
  const [catFilter, setCatFilter] = useState<string>('all');

  const load = () => Promise.all([getPrompts(), getUsers()]).then(([p, u]) => { setPrompts(p); setUsers(u); });
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPrompt({ ...form, created_by: Number(form.created_by) });
      setForm({ input_text: '', category: 'normal', risk_level: 'low', created_by: '' });
      setShowForm(false);
      load();
    } finally { setLoading(false); }
  };

  const filtered = catFilter === 'all' ? prompts : prompts.filter(p => p.category === catFilter);

  const counts = CATEGORIES.reduce<Record<string, number>>((acc, c) => {
    acc[c] = prompts.filter(p => p.category === c).length;
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-indigo-400" />
            <h1 className="text-xl font-semibold" style={{ color: '#e2e8f0' }}>Prompt Library</h1>
          </div>
          <p className="text-sm" style={{ color: '#475569' }}>Security test prompts organized by attack category and risk level</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
          <Plus size={14} /> Add Prompt
        </button>
      </div>

      {/* Category overview cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {CATEGORIES.map(c => {
          const cfg = CAT_CONFIG[c];
          const Icon = cfg.icon;
          const active = catFilter === c;
          return (
            <button key={c} onClick={() => setCatFilter(catFilter === c ? 'all' : c)}
              className={`rounded-xl border p-4 text-left transition-all ${active ? 'border-indigo-500/50' : 'hover:border-slate-600'}`}
              style={{ backgroundColor: active ? `${cfg.bg}` : '#10121c', borderColor: active ? undefined : '#1e2236' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                  <Icon size={12} style={{ color: cfg.text } as React.CSSProperties} />
                </div>
                <span className="text-xs font-semibold" style={{ color: cfg.text }}>{cfg.label}</span>
              </div>
              <p className="text-2xl font-bold mb-0.5" style={{ color: '#e2e8f0' }}>{counts[c] || 0}</p>
              <p className="text-xs" style={{ color: '#475569' }}>{cfg.description}</p>
            </button>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-xl border w-full max-w-lg p-6" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Add Test Prompt</h2>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Add a new security test case to the library</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-white/5">
                <X size={16} style={{ color: '#64748b' }} />
              </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Prompt Text</label>
                <textarea required rows={4} value={form.input_text}
                  onChange={e => setForm(f => ({ ...f, input_text: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
                  style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}
                  placeholder="Enter the security test prompt or adversarial input..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Attack Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_CONFIG[c]?.label || c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Risk Level</label>
                  <select value={form.risk_level} onChange={e => setForm(f => ({ ...f, risk_level: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}>
                    {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Author</label>
                <select required value={form.created_by} onChange={e => setForm(f => ({ ...f, created_by: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}>
                  <option value="">Select user...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm border"
                  style={{ borderColor: '#1e2236', color: '#64748b' }}>Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50">
                  {loading ? 'Saving...' : 'Add Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prompt table */}
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: '#1e2236' }}>
          <p className="text-xs" style={{ color: '#475569' }}>
            {catFilter !== 'all' ? `${CAT_CONFIG[catFilter]?.label} — ` : ''}{filtered.length} prompt{filtered.length !== 1 ? 's' : ''}
          </p>
          {catFilter !== 'all' && (
            <button onClick={() => setCatFilter('all')} className="text-xs text-indigo-400 hover:text-indigo-300">Clear filter</button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #1e2236' }}>
              {['#', 'Prompt', 'Category', 'Risk', 'Author'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center" style={{ color: '#475569' }}>
                <FileText size={28} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No prompts found.</p>
              </td></tr>
            ) : filtered.map(p => {
              const cfg = CAT_CONFIG[p.category];
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #1e2236' }}>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: '#475569' }}>{p.id}</td>
                  <td className="px-5 py-3" style={{ maxWidth: 360 }}>
                    <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{p.input_text}</p>
                  </td>
                  <td className="px-5 py-3">
                    {cfg && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                        {cfg.label}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      p.risk_level === 'high' ? 'bg-red-900/40 text-red-300' :
                      p.risk_level === 'medium' ? 'bg-amber-900/40 text-amber-300' :
                      'bg-emerald-900/40 text-emerald-300'
                    }`}>{p.risk_level}</span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#64748b' }}>
                    {users.find(u => u.id === p.created_by)?.name || `User ${p.created_by}`}
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
