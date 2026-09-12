import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useOrderAlarm } from '../../lib/useOrderAlarm';
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, CreditCard,
  Star, Settings, LogOut, Menu, X, Music,
} from 'lucide-react';

const ADMIN_EMAIL = 'loosevs@icloud.com';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Producten', icon: Package },
  { to: '/admin/categories', label: 'Categorieën', icon: FolderTree },
  { to: '/admin/orders', label: 'Bestellingen', icon: ShoppingCart },
  { to: '/admin/payments', label: 'Betalingen', icon: CreditCard },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/settings', label: 'Instellingen', icon: Settings },
];

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      setAuthed(!!session && session.user.email === ADMIN_EMAIL);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session && session.user.email === ADMIN_EMAIL);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useOrderAlarm(authed);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setError('Dit account heeft geen toegang tot het beheerpaneel.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-stone-300 border-t-accent-600" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8">
          <div className="mb-6 flex items-center gap-2 text-stone-900">
            <Music className="h-6 w-6 text-accent-600" />
            <span className="text-lg font-bold">WaveGitaar Admin</span>
          </div>
          <h1 className="text-xl font-semibold text-stone-900">Inloggen</h1>
          <p className="mt-1 text-sm text-stone-500">Beheer je WaveGitaar winkel.</p>

          <form onSubmit={handleAuth} className="mt-6 space-y-4">
            <div>
              <label className="input-label">E-mailadres</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="input-label">Wachtwoord</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" minLength={6} />
            </div>
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" className="w-full btn-primary justify-center">
              Inloggen
            </button>
          </form>
          <Link to="/" className="mt-4 block text-center text-sm text-stone-400 hover:text-stone-600">Terug naar winkel</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-stone-200 bg-white md:block">
        <div className="flex h-16 items-center gap-2 border-b border-stone-200 px-6">
          <Music className="h-5 w-5 text-accent-600" />
          <span className="font-bold text-stone-900">WaveGitaar</span>
        </div>
        <nav className="p-3">
          {NAV.map((item) => {
            const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-stone-200 p-3">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100">
            <Music className="h-4 w-4" /> Naar winkel
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Uitloggen
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-64 bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-16 items-center justify-between border-b border-stone-200 px-6">
              <span className="font-bold text-stone-900">Admin</span>
              <button onClick={() => setSidebarOpen(false)}><X className="h-5 w-5 text-stone-400" /></button>
            </div>
            <nav className="p-3">
              {NAV.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100">
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              ))}
              <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Uitloggen
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 md:px-6">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden"><Menu className="h-5 w-5 text-stone-600" /></button>
          <h1 className="text-sm font-semibold text-stone-900 md:text-base">
            {NAV.find((n) => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))?.label ?? 'Admin'}
          </h1>
          <Link to="/" className="text-sm text-stone-500 hover:text-stone-900">Winkel bekijken</Link>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
