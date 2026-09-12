import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Seo } from '../components/Seo';
import GoogleButton from '../components/GoogleButton';
import { supabase } from '../lib/supabase';


function RobotCheck({ checked, onCheck }: { checked: boolean; onCheck: () => void }) {
  const [hovering, setHovering] = useState(false);
  return (
    <div
      className="flex items-center justify-between rounded-md border border-stone-300 bg-stone-50 px-4 py-3"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onCheck}
          className="h-6 w-6 cursor-pointer accent-blue-600"
        />
        <span className="text-sm text-stone-700">Ik ben geen robot</span>
      </label>
      <div className="flex flex-col items-center gap-0.5 text-stone-400">
        <ShieldCheck className={`h-7 w-7 transition-colors ${hovering ? 'text-blue-600' : ''}`} />
        <span className="text-[9px] font-medium text-stone-400">reCAPTCHA</span>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notRobot, setNotRobot] = useState(false);

  const redirectTo = (location.state as { from?: string })?.from ?? '/account';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!notRobot) {
      setError('Vink aan dat je geen robot bent.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Vul een geldig e-mailadres in.');
      return;
    }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      navigate(redirectTo);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Inloggen mislukt.';
      if (msg.toLowerCase().includes('invalid')) {
        setError('E-mailadres of wachtwoord is onjuist.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 focus:outline-none';

  return (
    <>
      <Seo title="Inloggen" url="/login" />
      <div className="min-h-screen bg-stone-50">
        <div className="container-content flex items-center justify-center py-16">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">Welkom terug</h1>
              <p className="mt-2 text-sm text-stone-500">
                Nog geen account?{' '}
                <Link to="/register" className="font-medium text-accent-700 hover:text-accent-800">
                  Maak er een aan
                </Link>
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
              <GoogleButton label="Inloggen met Google" />
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-stone-200" />
                <span className="text-xs text-stone-400">of met e-mail</span>
                <div className="h-px flex-1 bg-stone-200" />
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-stone-600">E-mailadres</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-stone-600">Wachtwoord</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                </div>
                <RobotCheck checked={notRobot} onCheck={() => setNotRobot(!notRobot)} />
                {error && (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-600 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-accent-700 disabled:opacity-60"
                >
                  {loading ? 'Bezig...' : <>Inloggen <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
