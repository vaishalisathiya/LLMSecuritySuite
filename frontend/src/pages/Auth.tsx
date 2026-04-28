import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { registerUser, loginUser } from '../api';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const navigate = useNavigate();

  if (localStorage.getItem('user')) {
    return <Navigate to="/" replace />;
  }

  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setForm({ name: '', username: '', email: '', password: '' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user =
        mode === 'register'
          ? await registerUser({ name: form.name, username: form.username, email: form.email, password: form.password })
          : await loginUser({ username: form.username, password: form.password });
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { paddingLeft: '0.625rem', paddingRight: '0.625rem', paddingTop: '0.375rem', paddingBottom: '0.375rem' };
  const inputClass =
    'w-full rounded-xl border border-white/[0.08] bg-surface-raised text-sm text-fg placeholder:text-fg-muted/40 focus:border-accent/40 focus:outline-none transition-colors';

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-void px-4 [background-image:radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(34,255,233,0.07),transparent_55%)]">
      <div className="w-full max-w-[460px]">
        {/* Brand */}
        <div className="flex flex-col items-center gap-4 text-center" style={{ marginBottom: '1rem' }}>
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-accent/35 bg-accent-secondary/35 text-accent shadow-[0_0_0_1px_rgba(34,255,233,0.08)]">
            <ShieldAlert size={26} strokeWidth={2} />
          </div>
          <div>
            <p className="font-heading text-xl font-semibold leading-snug tracking-tight text-accent">
              LLM Security Suite
            </p>
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-fg-muted">
              Vulnerability Lab
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface-panel shadow-[0_18px_48px_-28px_rgba(0,0,0,0.85),0_1px_0_0_rgba(255,255,255,0.03)]" style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
          {/* Heading */}
          <h2 className="text-lg font-semibold text-fg-strong" style={{ marginBottom: '1rem' }}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-fg-muted">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-muted">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                placeholder="your_username"
                autoComplete="username"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-fg-muted">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@company.com"
                  autoComplete="email"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-muted">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className={inputClass}
                  style={{ ...inputStyle, paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-muted transition-colors hover:text-fg"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-3.5 py-2.5 text-xs leading-relaxed text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center rounded-xl bg-accent py-3 text-sm font-semibold text-surface-void transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {/* Toggle link */}
            <p className="text-center text-sm text-fg-muted">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-semibold text-accent hover:text-accent/80 transition-colors"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-semibold text-accent hover:text-accent/80 transition-colors"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
