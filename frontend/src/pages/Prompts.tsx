import { useEffect, useState } from 'react';
import { getPrompts, createPrompt, getUsers } from '../api';
import type { Prompt, User } from '../api';
import { Plus, FileText, X, AlertTriangle, Shield, Database, CheckCircle } from 'lucide-react';
import { Page, PageHeader } from '../ui/page';
import { SURFACE_CARD } from '../ui/surfaces';

const CATEGORIES = ['prompt_injection', 'jailbreak', 'data_exfiltration', 'normal'];
const RISK_LEVELS = ['low', 'medium', 'high'];

const cardShell = SURFACE_CARD;

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
  const [form, setForm] = useState({ input_text: '', category: 'normal', risk_level: 'low', created_by: '', acceptance_criteria: '' });
  const [loading, setLoading] = useState(false);
  const [catFilter, setCatFilter] = useState<string>('all');

  const load = () => Promise.all([getPrompts(), getUsers()]).then(([p, u]) => { setPrompts(p); setUsers(u); });
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPrompt({ ...form, created_by: Number(form.created_by) });
      setForm({ input_text: '', category: 'normal', risk_level: 'low', created_by: '', acceptance_criteria: '' });
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
    <Page>
      <div className="relative" style={{ marginBottom: '32px' }}>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="absolute right-0 inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/15"
          style={{ bottom: 'calc(100% + 8px)' }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Add Prompt
        </button>
        <div className="flex min-w-0 flex-col gap-10">
        {/* Category overview cards — own section; gap-10 on parent guarantees 40px before table (no margin collapse) */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((c) => {
          const cfg = CAT_CONFIG[c];
          const Icon = cfg.icon;
          const active = catFilter === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCatFilter(catFilter === c ? 'all' : c)}
              className={`${cardShell} text-left transition-colors ${
                active ? 'border-accent/35' : 'hover:bg-white/[0.02]'
              } px-6 py-5`}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: cfg.bg }}>
                  <span style={{ color: cfg.text }}>
                    <Icon size={14} />
                  </span>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: cfg.text }}>
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <p className="font-heading text-[32px] font-semibold leading-none tracking-tight text-fg-strong">
                  {counts[c] || 0}
                </p>
                <span className="pb-1 text-xs text-fg-muted">prompts</span>
              </div>
              <p className="mt-2 text-xs text-fg-muted">{cfg.description}</p>
            </button>
          );
        })}
        </section>

        {/* Prompts table — outer section; vertical space from cards comes from parent gap-10 */}
        <section className="w-full min-w-0">
        <div className={cardShell}>
          <div className="px-6 pb-5 pt-8">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <p className="text-sm leading-relaxed text-fg-muted">
                {catFilter !== 'all' ? `${CAT_CONFIG[catFilter]?.label} — ` : ''}
                {filtered.length} prompt{filtered.length !== 1 ? 's' : ''}
              </p>
              {catFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setCatFilter('all')}
                  className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-accent hover:text-accent/90"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/[0.1]">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/[0.12] bg-surface-raised/55">
                    {['#', 'Prompt', 'Category', 'Risk', 'Author'].map((h) => (
                      <th
                        key={h}
                        className="min-h-[48px] px-[18px] text-left align-middle text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-fg-muted/85 first:pl-[22px]" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-[18px] py-16 text-center text-sm leading-relaxed text-fg-muted">
                        <FileText size={28} className="mx-auto mb-3 text-fg-muted/40" />
                        No prompts yet. Add your first test prompt to get started.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const cfg = CAT_CONFIG[p.category];
                      return (
                        <tr
                          key={p.id}
                          className="min-h-[44px] border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.03]"
                        >
                          <td className="align-middle px-[18px] pl-[22px] font-mono text-sm tabular-nums text-fg-muted" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                            {p.id}
                          </td>
                          <td className="max-w-[520px] align-middle px-[18px]" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                            <p className="truncate text-sm leading-relaxed text-fg" title={p.input_text}>
                              {p.input_text}
                            </p>
                          </td>
                          <td className="align-middle px-[18px]" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                            {cfg && (
                              <span
                                className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                                style={{ backgroundColor: cfg.bg, color: cfg.text }}
                              >
                                {cfg.label}
                              </span>
                            )}
                          </td>
                          <td className="align-middle px-[18px]" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium capitalize leading-snug ${
                                p.risk_level === 'high'
                                  ? 'bg-red-900/40 text-red-300'
                                  : p.risk_level === 'medium'
                                    ? 'bg-amber-900/40 text-amber-300'
                                    : 'bg-emerald-900/35 text-emerald-300'
                              }`}
                            >
                              {p.risk_level}
                            </span>
                          </td>
                          <td className="align-middle px-[18px] text-sm leading-relaxed text-fg-muted" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                            {users.find((u) => u.id === p.created_by)?.name || `User ${p.created_by}`}
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
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`w-full max-w-2xl ${cardShell}`} style={{ padding: '2rem' }}>
            <div className="flex items-start justify-between" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h2 className="font-heading text-xl font-semibold text-fg-strong">Add Test Prompt</h2>
                <p className="text-xs text-fg-muted" style={{ marginTop: '0.35rem' }}>Add a new security test case to the library</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 text-fg-muted hover:bg-white/[0.06]"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submit} className="flex flex-col" style={{ gap: '1.25rem' }}>
              <div>
                <label className="block text-xs font-medium text-fg-muted" style={{ marginBottom: '0.5rem' }}>Prompt Text</label>
                <textarea
                  required
                  rows={4}
                  value={form.input_text}
                  onChange={(e) => setForm((f) => ({ ...f, input_text: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-surface-raised text-sm text-fg outline-none placeholder:text-fg-muted focus:border-accent/40" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                  placeholder="Enter the security test prompt or adversarial input..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-fg-muted" style={{ marginBottom: '0.5rem' }}>Attack Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-surface-raised text-sm text-fg outline-none focus:border-accent/40" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                  >
                    {CATEGORIES.map((cc) => (
                      <option key={cc} value={cc}>
                        {CAT_CONFIG[cc]?.label || cc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-fg-muted" style={{ marginBottom: '0.5rem' }}>Risk Level</label>
                  <select
                    value={form.risk_level}
                    onChange={(e) => setForm((f) => ({ ...f, risk_level: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-surface-raised text-sm text-fg outline-none focus:border-accent/40" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                  >
                    {RISK_LEVELS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-muted" style={{ marginBottom: '0.5rem' }}>Author</label>
                <select
                  required
                  value={form.created_by}
                  onChange={(e) => setForm((f) => ({ ...f, created_by: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-surface-raised text-sm text-fg outline-none focus:border-accent/40" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                >
                  <option value="">Select user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-muted" style={{ marginBottom: '0.5rem' }}>Acceptance Criteria</label>
                <input
                  type="text"
                  required
                  value={form.acceptance_criteria}
                  onChange={(e) => setForm((f) => ({ ...f, acceptance_criteria: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-surface-raised text-sm text-fg outline-none placeholder:text-fg-muted focus:border-accent/40" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                  placeholder="e.g. regex pattern or keyword the response should NOT contain"
                />
                <p className="mt-1 text-xs text-fg-muted">
                  Used by the evaluator to detect vulnerabilities in the model response
                </p>
              </div>
              <div className="flex gap-3" style={{ paddingTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm text-fg-muted transition-colors hover:bg-white/[0.04]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-surface-void transition-colors hover:bg-accent/90 disabled:opacity-50"
                >
                  {loading ? 'Saving…' : 'Add Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </Page>
  );
}
