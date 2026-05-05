import { useEffect, useState } from 'react';
import { getModels, createModel, deleteModel } from '../api';
import type { Model } from '../api';
import { Plus, Trash2, Cpu, X, Key, Globe } from 'lucide-react';
import { Page, PageHeader } from '../ui/page';
import { SURFACE_CARD } from '../ui/surfaces';

const ACCESS_METHODS = ['API', 'Local', 'HuggingFace', 'Browser'];
const MODEL_TYPES = ['LLM', 'Embedding', 'Multimodal', 'Vision'];

const cardShell = SURFACE_CARD;

const PROVIDER_COLORS: Record<string, { bg: string; text: string }> = {
  OpenAI: { bg: '#064e3b', text: '#6ee7b7' },
  Anthropic: { bg: '#312e81', text: '#c4b5fd' },
  Google: { bg: '#1e3a5f', text: '#93c5fd' },
  Meta: { bg: '#431407', text: '#fdba74' },
  HuggingFace: { bg: '#422006', text: '#fcd34d' },
};

export default function Models() {
  const [models, setModels] = useState<Model[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', provider: '', model_type: 'LLM', interface_type: 'api', access_method: 'API', model_identifier: '', credential_reference: '', access_url: '', browser_textbox: '' });
  const [loading, setLoading] = useState(false);

  const load = () => getModels().then(setModels);
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createModel({ ...form, credential_reference: form.credential_reference || null, access_url: form.access_url || null, browser_textbox: form.browser_textbox || null });
      setForm({ name: '', provider: '', model_type: 'LLM', interface_type: 'api', access_method: 'API', model_identifier: '', credential_reference: '', access_url: '', browser_textbox: '' });
      setShowForm(false);
      load();
    } finally { setLoading(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Remove this model from the registry?')) return;
    await deleteModel(id);
    load();
  };

  const providerStyle = (provider: string) => PROVIDER_COLORS[provider] || { bg: '#1e2236', text: '#94a3b8' };

  return (
    <Page>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`w-full max-w-md ${cardShell} p-6`}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-heading font-semibold text-fg-strong">Register Model</h2>
                <p className="mt-0.5 text-xs text-fg-muted">Add a new model to the testing registry</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 text-fg-muted hover:bg-white/[0.06]"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fg-muted">Model Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-surface-raised px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-accent/40"
                    placeholder="e.g. gpt-4o"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fg-muted">Provider</label>
                  <input
                    type="text"
                    required
                    value={form.provider}
                    onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-surface-raised px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-accent/40"
                    placeholder="e.g. OpenAI"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fg-muted">Model Type</label>
                  <select
                    value={form.model_type}
                    onChange={(e) => setForm((f) => ({ ...f, model_type: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-surface-raised px-3 py-2 text-sm text-fg outline-none focus:border-accent/40"
                  >
                    {MODEL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fg-muted">Access Method</label>
                  <select
                    value={form.access_method}
                    onChange={(e) => setForm((f) => ({ ...f, access_method: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-surface-raised px-3 py-2 text-sm text-fg outline-none focus:border-accent/40"
                  >
                    {ACCESS_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-muted">Model Identifier</label>
                <input
                  type="text"
                  required
                  value={form.model_identifier}
                  onChange={(e) => setForm((f) => ({ ...f, model_identifier: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-surface-raised px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-accent/40"
                  placeholder="e.g. gpt-4o, claude-3-5-sonnet-latest"
                />
                <p className="mt-1 text-xs text-fg-muted">The model ID used in API calls</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-muted">Credential Reference</label>
                <input
                  type="text"
                  value={form.credential_reference}
                  onChange={(e) => setForm((f) => ({ ...f, credential_reference: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-surface-raised px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-accent/40"
                  placeholder="e.g. openai-api-key (secret name)"
                />
                <p className="mt-1 text-xs text-fg-muted">Reference to the credential in secrets manager</p>
              </div>
              {form.access_method === 'Browser' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-fg-muted">Access URL</label>
                    <input
                      type="text"
                      value={form.access_url}
                      onChange={(e) => setForm((f) => ({ ...f, access_url: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.08] bg-surface-raised px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-accent/40"
                      placeholder="e.g. https://chat.openai.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-fg-muted">Input Field Selector</label>
                    <input
                      type="text"
                      value={form.browser_textbox}
                      onChange={(e) => setForm((f) => ({ ...f, browser_textbox: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.08] bg-surface-raised px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-accent/40"
                      placeholder="e.g. #prompt-textarea (CSS selector)"
                    />
                    <p className="mt-1 text-xs text-fg-muted">CSS selector for the chat input box</p>
                  </div>
                </>
              )}
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
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-surface-void transition-colors hover:bg-accent/90 disabled:opacity-50"
                >
                  {loading ? 'Saving…' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Model cards */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="absolute right-0 inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/15"
          style={{ bottom: 'calc(100% + 8px)' }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Register Model
        </button>
      {models.length === 0 ? (
        <div className={`${cardShell} px-6 py-14 text-center`}>
          <Cpu size={28} className="mx-auto mb-3 text-fg-muted/40" />
          <p className="text-sm text-fg-muted">No models registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {models.map((m) => {
            const ps = providerStyle(m.provider);
            return (
              <div key={m.id} className={`${cardShell} group relative px-6 py-6`}>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className="absolute right-4 top-4 rounded-lg p-1.5 text-red-400/90 opacity-0 transition-opacity hover:bg-red-900/30 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: ps.bg }}>
                    <Cpu size={16} style={{ color: ps.text }} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg-strong">{m.name}</p>
                    <span className="mt-1 inline-flex rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: ps.bg, color: ps.text }}>
                      {m.provider}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted">Type</span>
                    <span className="rounded bg-white/[0.06] px-2 py-0.5 font-medium text-fg-strong/90">{m.model_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted">Access</span>
                    <div className="flex items-center gap-1.5 text-fg-strong/90">
                      {m.access_method === 'API' ? <Globe size={10} className="text-accent/80" /> : <Cpu size={10} className="text-fg-muted/80" />}
                      <span>{m.access_method}</span>
                    </div>
                  </div>
                  {m.credential_reference && (
                    <div className="flex items-center justify-between">
                      <span className="text-fg-muted">Credential</span>
                      <div className="flex items-center gap-1.5">
                        <Key size={10} className="text-amber-400/90" />
                        <span className="font-mono text-fg-muted">{m.credential_reference}</span>
                      </div>
                    </div>
                  )}
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
