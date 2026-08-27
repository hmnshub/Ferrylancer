import { useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const roleLabels = {
  client: 'client',
  talent: 'freelancer',
};

export default function AuthModal({ mode, role, onClose }) {
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setStatus('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the shared .env file.');
      return;
    }

    setLoading(true);
    setStatus('');
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role },
            emailRedirectTo: redirectTo,
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    if (isSignUp) {
      setStatus('Account created. Check your email to confirm your account, then log in.');
    } else {
      onClose();
    }
  }

  const title = isSignUp
    ? `Join as a ${roleLabels[role] ?? 'member'}`
    : 'Welcome back';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-label="Close sign in dialog" />
      <div className="relative w-full max-w-md rounded-xl2 bg-white p-6 shadow-2xl sm:p-8">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-cloud hover:text-ink" aria-label="Close">
          <X size={20} />
        </button>
        <p className="text-sm font-semibold text-blue-600">Ferrylance</p>
        <h2 id="auth-title" className="mt-1 font-display text-2xl font-extrabold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-muted">{isSignUp ? 'Create your account to get started.' : 'Log in to continue to Ferrylance.'}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-ink">Email
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-blue-100 px-3 py-3 text-ink outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block text-sm font-semibold text-ink">Password
            <input required minLength="6" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-blue-100 px-3 py-3 text-ink outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          {status && <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800" role="status">{status}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-500 px-5 py-3 font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-70">
            {loading && <LoaderCircle size={18} className="animate-spin" />}
            {isSignUp ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          {isSignUp ? 'Already have an account?' : 'New to Ferrylance?'}{' '}
          <button onClick={() => { setIsSignUp((value) => !value); setStatus(''); }} className="font-semibold text-blue-600 hover:text-blue-700">
            {isSignUp ? 'Log in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  );
}
