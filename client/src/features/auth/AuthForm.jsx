import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth.js';

export function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) await register({ name: form.name, email: form.email, password: form.password });
      else await login({ email: form.email, password: form.password });
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-black/20 sm:p-9">
        <Link to="/login" className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">IssuePilot</Link>
        <h1 className="mt-8 text-3xl font-bold tracking-tight">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {isRegister ? 'Start organizing your work with IssuePilot.' : 'Sign in to continue to IssuePilot.'}
        </p>

        <form className="mt-8 space-y-5" onSubmit={submit}>
          {isRegister && (
            <label className="block text-sm font-medium text-slate-300">
              Name
              <input className={inputClass} name="name" autoComplete="name" value={form.name} onChange={update} minLength={2} maxLength={80} required />
            </label>
          )}
          <label className="block text-sm font-medium text-slate-300">
            Email
            <input className={inputClass} name="email" type="email" autoComplete="email" value={form.email} onChange={update} maxLength={254} required />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Password
            <input className={inputClass} name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={update} minLength={8} maxLength={72} required />
            {isRegister && <span className="mt-1 block text-xs text-slate-500">Use at least 8 characters.</span>}
          </label>

          {error && <p className="rounded-xl border border-rose-900 bg-rose-950/60 px-4 py-3 text-sm text-rose-200" role="alert">{error}</p>}
          <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-400">
          {isRegister ? 'Already have an account?' : 'New to IssuePilot?'}{' '}
          <Link className="font-semibold text-cyan-300 hover:text-cyan-200" to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </main>
  );
}
