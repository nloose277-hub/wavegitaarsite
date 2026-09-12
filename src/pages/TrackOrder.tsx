import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Package, PackageCheck, Truck, Home,
  CheckCircle2, Circle, AlertCircle, ArrowRight, KeyRound,
} from 'lucide-react';
import { Seo } from '../components/Seo';
import { fetchTracking, type TrackingInfo } from '../lib/api';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/types';

type Step = {
  key: string;
  label: string;
  description: string;
  icon: typeof Package;
};

const STEPS: Step[] = [
  { key: 'ontvangen',   label: 'Bestelling ontvangen',  description: 'We hebben je bestelling ontvangen en betaling bevestigd.', icon: PackageCheck },
  { key: 'verwerkt',    label: 'Bestelling verwerkt',   description: 'Je bestelling is in behandeling genomen door ons team.', icon: Package },
  { key: 'voorbereid',  label: 'Pakket voorbereid',     description: 'Je bestelling is zorgvuldig verpakt en klaar voor verzending.', icon: PackageCheck },
  { key: 'verzonden',   label: 'Onderweg',              description: 'Je pakket is onderweg naar het bezorgpunt.', icon: Truck },
  { key: 'afgeleverd',  label: 'Afgeleverd',            description: 'Je pakket is afgeleverd. Veel speelplezier!', icon: Home },
];

function statusToStepIndex(status: string | null | undefined): number {
  if (!status) return 0;
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TrackOrder() {
  const { trackingCode } = useParams<{ trackingCode?: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState(trackingCode ?? '');
  const [data, setData] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const doSearch = async (num: string) => {
    const trimmed = num.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const result = await fetchTracking(trimmed);
      if (!result) {
        setData(null);
        setError('Geen bestelling gevonden met dit ordernummer, of de betaling is nog niet bevestigd.');
      } else {
        setData(result);
      }
    } catch {
      setData(null);
      setError('Er ging iets mis bij het ophalen van je bestelling. Probeer het later opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const trackingCodeUpper = trackingCode?.toUpperCase();
  const lastStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (trackingCode) {
      setInput(trackingCode);
      doSearch(trackingCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingCode]);

  // Subscribe to realtime updates on the orders table so the customer
  // sees status changes live without refreshing the page.
  useEffect(() => {
    if (!trackingCodeUpper || !data) return;

    const channel = supabase
      .channel(`track-${trackingCodeUpper}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const newRow = payload.new as Record<string, unknown> | undefined;
          const oldRow = payload.old_record as Record<string, unknown> | undefined;
          if (!newRow) return;

          // Only react if this is our order (match by tracking_code)
          const rowTrackingCode = newRow.tracking_code as string | undefined;
          if (rowTrackingCode?.toUpperCase() !== trackingCodeUpper) return;

          const newStatus = newRow.status as string | undefined;
          if (oldRow?.status === newStatus) return;
          lastStatusRef.current = newStatus ?? null;

          // Update the local tracking data with the new status
          setData((prev) =>
            prev ? { ...prev, status: newStatus ?? prev.status } : prev,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackingCodeUpper, data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) navigate(`/tracken/${trimmed}`);
  };

  const currentStep = data ? statusToStepIndex(data.status) : 0;

  return (
    <>
      <Seo title="Track & Trace - Bestelling volgen" url="/tracken" />
      <div className="container-content py-12 md:py-16">
        {/* Search */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-700">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-stone-900 md:text-4xl">Track &amp; Trace</h1>
          <p className="mt-3 text-stone-600">
            Voer je persoonlijke track &amp; trace code in om je bestelling live te volgen. Je hebt deze code ontvangen na je betaling. Elke bestelling heeft zijn eigen persoonlijke tijdlijn.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Bijv. WG-A4F8K2LQ"
                className="input-field pl-11"
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary sm:px-8">
              {loading ? 'Zoeken…' : 'Volgen'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="mt-12 flex justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
          </div>
        )}

        {/* Tracking result */}
        {data && !loading && (
          <div className="mx-auto mt-10 max-w-3xl">
            {/* Order header */}
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-stone-500">Track &amp; Trace code</p>
                  <p className="text-xl font-bold font-mono text-stone-900">{data.tracking_code}</p>
                  {data.customer_first_name && (
                    <p className="mt-1 text-sm text-stone-600">
                      Bestelling van {data.customer_first_name}{data.customer_last_name ? ` ${data.customer_last_name}` : ''}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-stone-400">Ordernummer: {data.order_number}</p>
                </div>
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <span className="badge border bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Betaald
                  </span>
                  {data.paid_at && (
                    <p className="text-xs text-stone-500">
                      Betaald op {formatDateTime(data.paid_at)}
                    </p>
                  )}
                </div>
              </div>

              {/* Order items summary */}
              {data.items.length > 0 && (
                <div className="mt-5 border-t border-stone-100 pt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">Inhoud van je bestelling</p>
                  <div className="space-y-2">
                    {data.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-stone-700">
                          {item.quantity}× {item.product_name}
                        </span>
                        <span className="text-stone-500">{formatPrice(item.unit_price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                    <span className="text-sm font-semibold text-stone-900">Totaal</span>
                    <span className="text-sm font-bold text-stone-900">{formatPrice(data.total)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">Jouw persoonlijke tijdlijn</h2>
            <span className="flex items-center gap-1.5 text-xs font-medium text-stone-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              Live
            </span>
          </div>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-stone-200" />

                <div className="space-y-8">
                  {STEPS.map((step, idx) => {
                    const isDone = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    const Icon = step.icon;

                    return (
                      <div key={step.key} className="relative flex items-start gap-5">
                        {/* Icon circle */}
                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                            isDone
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : 'border-stone-200 bg-white text-stone-300'
                          } ${isCurrent ? 'ring-4 ring-stone-100' : ''}`}
                        >
                          {isDone ? (
                            <Icon className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 pt-1 transition-opacity duration-300 ${isDone ? 'opacity-100' : 'opacity-50'}`}>
                          <div className="flex items-center gap-2">
                            <h3 className={`text-base font-semibold ${isDone ? 'text-stone-900' : 'text-stone-400'}`}>
                              {step.label}
                            </h3>
                            {isCurrent && (
                              <span className="badge bg-stone-900 text-white">
                                <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                                Huidige status
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-stone-600">{step.description}</p>


                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking number if available */}
              {data.tracking_number && (
                <div className="mt-6 rounded-lg bg-stone-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Track &amp; trace nummer</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-stone-900">{data.tracking_number}</p>
                </div>
              )}

              {currentStep === STEPS.length - 1 && (
                <div className="mt-6 flex items-start gap-3 rounded-lg bg-green-50 p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                  <p className="text-sm text-green-900">
                    Je bestelling is afgeleverd! We hopen dat je veel plezier beleeft aan je nieuwe gitaar. Heb je vragen? Neem dan contact met ons op via de contactpagina.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/products" className="btn-outline">Verder winkelen</Link>
              <Link to="/contact" className="btn-ghost">Vragen over je bestelling?</Link>
            </div>
          </div>
        )}

        {/* Initial state (no search yet) */}
        {!searched && !data && (
          <div className="mx-auto mt-12 max-w-md text-center">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-6">
              <KeyRound className="mx-auto h-8 w-8 text-stone-400" />
              <p className="mt-3 text-sm text-stone-500">
                Voer je persoonlijke track &amp; trace code in die je na je betaling hebt ontvangen. Nog geen code? Controleer de bevestigingspagina na het afrekenen.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
