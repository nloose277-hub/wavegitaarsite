import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, UserPlus, LogIn, ShoppingBag, Lock, ShieldCheck, Truck, ChevronLeft } from 'lucide-react';
import { Seo } from '../components/Seo';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/types';
import { useState, useEffect } from 'react';

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}

type OptionCardProps = {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  badge?: string;
  onClick?: () => void;
  to?: string;
  state?: { from: string };
  primary?: boolean;
};

function OptionCard({ icon, iconBg, title, subtitle, badge, onClick, to, state, primary }: OptionCardProps) {
  const inner = (
    <>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-stone-900">{title}</p>
          {badge && (
            <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-700">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm leading-snug text-stone-500">{subtitle}</p>
      </div>
      <ArrowRight className={`h-5 w-5 shrink-0 transition-transform duration-200 ${primary ? 'text-accent-600' : 'text-stone-300'}`} />
    </>
  );

  const baseClass = `group flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ${
    primary
      ? 'border-accent-200 bg-accent-50/50 shadow-sm hover:border-accent-400 hover:bg-accent-50 hover:shadow-md'
      : 'border-stone-200 bg-white shadow-sm hover:border-stone-300 hover:shadow-md'
  }`;

  if (to) {
    return (
      <Link to={to} state={state} className={baseClass}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {inner}
    </button>
  );
}

export default function CheckoutGate() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { items, subtotal, shipping, total } = useCart();
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/checkout', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogle = async () => {
    setOauthError('');
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/checkout` },
      });
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Inloggen met Google mislukt.';
      if (msg.toLowerCase().includes('provider') || msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('oauth')) {
        setOauthError('Google-inloggen is momenteel niet beschikbaar. Probeer e-mail of betaal als gast.');
      } else {
        setOauthError(msg);
      }
      setOauthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-accent-600" />
      </div>
    );
  }

  return (
    <>
      <Seo title="Afrekenen" url="/checkout/gate" />

      {/* Stepper */}
      <div className="border-b border-stone-200 bg-white">
        <div className="container-content">
          <div className="flex items-center justify-between py-5">
            <Link to="/cart" className="flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900">
              <ChevronLeft className="h-4 w-4" /> Terug naar winkelwagen
            </Link>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-600 text-xs font-bold text-white">1</span>
              <span className="text-sm font-semibold text-stone-900">Inloggen</span>
              <span className="mx-2 h-px w-8 bg-stone-300" />
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-400">2</span>
              <span className="text-sm font-medium text-stone-400">Betaalgegevens</span>
              <span className="mx-2 h-px w-8 bg-stone-300" />
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-400">3</span>
              <span className="text-sm font-medium text-stone-400">Bevestiging</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-content py-8 md:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Left: Auth options */}
            <div className="lg:col-span-3">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">Hoe wil je afrekenen?</h1>
                <p className="mt-1.5 text-sm text-stone-500">
                  Kies hoe je verder wilt gaan. Je kunt altijd terug naar de winkelwagen.
                </p>
              </div>

              <div className="space-y-3">
                {/* Google — prominent at top */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={oauthLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-stone-200 bg-white px-4 py-4 text-sm font-semibold text-stone-700 shadow-sm transition-all duration-200 hover:border-stone-300 hover:shadow-md disabled:opacity-60"
                >
                  {oauthLoading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                      Verbinding maken met Google...
                    </>
                  ) : (
                    <>
                      <GoogleIcon size={20} /> Doorgaan met Google
                    </>
                  )}
                </button>

                {oauthError && (
                  <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                    {oauthError}
                  </p>
                )}

                {/* Divider */}
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-stone-200" />
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-400">of kies een optie</span>
                  <div className="h-px flex-1 bg-stone-200" />
                </div>

                {/* Login — first, before register */}
                <OptionCard
                  icon={<LogIn className="h-5 w-5 text-accent-700" />}
                  iconBg="bg-accent-50"
                  title="Inloggen"
                  subtitle="Al een account? Log in voor een snellere afrekening met opgeslagen gegevens."
                  to="/login"
                  state={{ from: '/checkout' }}
                  primary
                />

                {/* Register — after login */}
                <OptionCard
                  icon={<UserPlus className="h-5 w-5 text-stone-600" />}
                  iconBg="bg-stone-100"
                  title="Account aanmaken"
                  subtitle="Nieuw hier? Maak een account aan en profiteer van ordergeschiedenis en sneller afrekenen."
                  to="/register"
                  state={{ from: '/checkout' }}
                />

                {/* Guest checkout */}
                <OptionCard
                  icon={<ShoppingBag className="h-5 w-5 text-stone-600" />}
                  iconBg="bg-stone-100"
                  title="Betalen als gast"
                  subtitle="Geen account nodig — vul je gegevens in tijdens het afrekenen."
                  onClick={() => navigate('/checkout?guest=true')}
                />
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-stone-200 pt-6">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <ShieldCheck className="h-4 w-4 text-green-600" /> Veilig afrekenen
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Lock className="h-4 w-4 text-green-600" /> SSL-versleuteling
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Truck className="h-4 w-4 text-green-600" /> Snelle levering
                </div>
              </div>
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-stone-900">
                  <ShoppingBag className="h-4 w-4 text-stone-500" /> Jouw bestelling
                </h2>

                {/* Items */}
                <div className="mb-4 space-y-3">
                  {items.length === 0 ? (
                    <p className="text-sm text-stone-400">Geen producten in je winkelwagen.</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.key} className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-white">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-stone-300">
                              <ShoppingBag className="h-4 w-4" />
                            </div>
                          )}
                          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-700 px-1 text-[10px] font-bold text-white">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-stone-700">{item.name}</p>
                          <p className="text-xs text-stone-400">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-2.5 border-t border-stone-200 pt-4 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotaal</span>
                    <span className="font-medium text-stone-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Verzending</span>
                    <span className="font-medium text-green-600">Gratis</span>
                  </div>
                  <div className="flex justify-between border-t border-stone-200 pt-3 text-base">
                    <span className="font-bold text-stone-900">Totaal</span>
                    <span className="font-bold text-stone-900">{formatPrice(total)}</span>
                  </div>
                </div>

                <Link
                  to="/cart"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
                >
                  Winkelwagen aanpassen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
