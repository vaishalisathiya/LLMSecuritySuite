import { useEffect, useState } from 'react';
import { getModels, createModel, deleteModel } from '../api';
import type { Model } from '../api';
import { Plus, Trash2, Cpu, X, Key, Globe } from 'lucide-react';

const ACCESS_METHODS = ['API', 'Local', 'HuggingFace', 'Browser'];
const MODEL_TYPES = ['LLM', 'Embedding', 'Multimodal', 'Vision'];

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
  const [form, setForm] = useState({ name: '', provider: '', model_type: 'LLM', access_method: 'API', credential_reference: '', access_url: '', browser_textbox: '' });
  const [loading, setLoading] = useState(false);

  const load = () => getModels().then(setModels);
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createModel({ ...form, credential_reference: form.credential_reference || null, access_url: form.access_url || null, browser_textbox: form.browser_textbox || null });
      setForm({ name: '', provider: '', model_type: 'LLM', access_method: 'API', credential_reference: '', access_url: '', browser_textbox: '' });
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
    <div className="p-8">
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={16} className="text-indigo-400" />
            <h1 className="text-xl font-semibold" style={{ color: '#e2e8f0' }}>Model Registry</h1>
          </div>
          <p className="text-sm" style={{ color: '#475569' }}>LLM models registered for security vulnerability testing</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
          <Plus size={14} /> Register Model
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-xl border w-full max-w-md p-6" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>Register Model</h2>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Add a new LLM to the testing registry</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-white/5">
                <X size={16} style={{ color: '#64748b' }} />
              </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Model Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}
                    placeholder="e.g. gpt-4o" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Provider</label>
                  <input type="text" required value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}
                    placeholder="e.g. OpenAI" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Model Type</label>
                  <select value={form.model_type} onChange={e => setForm(f => ({ ...f, model_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}>
                    {MODEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Access Method</label>
                  <select value={form.access_method} onChange={e => setForm(f => ({ ...f, access_method: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}>
                    {ACCESS_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Credential Reference</label>
                <input type="text" value={form.credential_reference} onChange={e => setForm(f => ({ ...f, credential_reference: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}
                  placeholder="e.g. openai-api-key (secret name)" />
                <p className="text-xs mt-1" style={{ color: '#475569' }}>Reference to the credential in secrets manager</p>
              </div>
              {form.access_method === 'Browser' && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Access URL</label>
                    <input type="text" value={form.access_url} onChange={e => setForm(f => ({ ...f, access_url: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                      style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}
                      placeholder="e.g. https://chat.openai.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Input Field Selector</label>
                    <input type="text" value={form.browser_textbox} onChange={e => setForm(f => ({ ...f, browser_textbox: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                      style={{ backgroundColor: '#0b0d14', borderColor: '#1e2236', color: '#e2e8f0' }}
                      placeholder="e.g. #prompt-textarea (CSS selector)" />
                    <p className="text-xs mt-1" style={{ color: '#475569' }}>CSS selector for the chat input box</p>
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm border"
                  style={{ borderColor: '#1e2236', color: '#64748b' }}>Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50">
                  {loading ? 'Saving...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Model cards */}
      {models.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
          <Cpu size={32} className="mx-auto mb-3 opacity-20" style={{ color: '#94a3b8' }} />
          <p className="text-sm" style={{ color: '#475569' }}>No models registered yet.</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {models.map(m => {
            const ps = providerStyle(m.provider);
            return (
              <div key={m.id} className="rounded-xl border p-5 group relative" style={{ backgroundColor: '#10121c', borderColor: '#1e2236' }}>
                <button onClick={() => remove(m.id)}
                  className="absolute top-4 right-4 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/30 text-red-400">
                  <Trash2 size={13} />
                </button>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ps.bg }}>
                    <Cpu size={16} style={{ color: ps.text }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#e2e8f0' }}>{m.name}</p>
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: ps.bg, color: ps.text }}>{m.provider}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: '#475569' }}>Type</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300">{m.model_type}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: '#475569' }}>Access</span>
                    <div className="flex items-center gap-1.5">
                      {m.access_method === 'API' ? <Globe size={10} className="text-blue-400" /> : <Cpu size={10} className="text-purple-400" />}
                      <span style={{ color: '#94a3b8' }}>{m.access_method}</span>
                    </div>
                  </div>
                  {m.credential_reference && (
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: '#475569' }}>Credential</span>
                      <div className="flex items-center gap-1.5">
                        <Key size={10} className="text-amber-400" />
                        <span className="font-mono" style={{ color: '#94a3b8' }}>{m.credential_reference}</span>
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
  );
}
