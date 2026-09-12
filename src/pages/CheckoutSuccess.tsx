import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Check, Music, Truck, Mail, Copy, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { Seo } from '../components/Seo';

export default function CheckoutSuccess() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const orderNumber = (location.state as { orderNumber?: string } | null)?.orderNumber ?? searchParams.get('order') ?? undefined;
  const trackingCode = (location.state as { trackingCode?: string } | null)?.trackingCode ?? searchParams.get('tracking') ?? undefined;
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!trackingCode) return;
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Seo title="Bestelling geplaatst" url="/checkout/success" />
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-16 text-stone-900 sm:px-6">
        <div className="flex w-full max-w-2xl flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-sm sm:h-24 sm:w-24">
            <Check className="h-10 w-10 text-green-600 sm:h-12 sm:w-12" strokeWidth={3} />
          </div>
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            Betaling gelukt!
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-stone-600 sm:text-lg">
            Je bestelling is ontvangen en de betaling is bevestigd. Je krijgt een bevestigingsmail van ons (controleer ook je spamfolder). Bewaar je persoonlijke track &amp; trace code om je bestelling te volgen.
          </p>

          {trackingCode && (
            <div className="mt-10 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-center gap-2 text-stone-500">
                <KeyRound className="h-5 w-5" />
                <p className="text-sm font-medium uppercase tracking-wide">Jouw persoonlijke track &amp; trace code</p>
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <p className="text-2xl font-bold tracking-wider font-mono text-stone-900 sm:text-3xl">{trackingCode}</p>
                <button onClick={copyCode} className="rounded-md p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900" title="Kopieer code">
                  {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-3 text-sm text-stone-500">
                Bewaar deze code! Met deze code kun je op onze website je bestelling live volgen.
              </p>
              <Link
                to={`/tracken/${trackingCode}`}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
              >
                <Truck className="h-4 w-4" /> Bekijk nu je track &amp; trace
              </Link>
            </div>
          )}

          {orderNumber && !trackingCode && (
            <div className="mt-8 rounded-xl border border-stone-200 bg-white px-6 py-4">
              <p className="text-sm text-stone-500">Ordernummer</p>
              <p className="text-lg font-bold text-stone-900">{orderNumber}</p>
            </div>
          )}

          <div className="mt-8 grid w-full max-w-xl gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <Mail className="h-6 w-6 text-accent-600" />
              <p className="text-sm font-semibold text-stone-900">Bevestiging per e-mail</p>
              <p className="text-xs text-stone-500">Je ontvangt een bevestiging. Controleer ook je spam.</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <Truck className="h-6 w-6 text-accent-600" />
              <p className="text-sm font-semibold text-stone-900">Snelle levering</p>
              <p className="text-xs text-stone-500">Vóór 21:59 besteld = morgen in huis</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <Music className="h-6 w-6 text-accent-600" />
              <p className="text-sm font-semibold text-stone-900">Veel speelplezier!</p>
              <p className="text-xs text-stone-500">Geniet van je nieuwe gitaar</p>
            </div>
          </div>
          <Link to="/products" className="mt-8 rounded-lg border border-stone-300 bg-white px-8 py-3 text-sm font-semibold text-stone-700 transition-colors hover:border-accent-600 hover:text-accent-700">
            Verder winkelen
          </Link>
        </div>
      </div>
    </>
  );
}
