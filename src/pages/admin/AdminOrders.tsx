import { useEffect, useState } from 'react';
import { Eye, X, Package, Trash2, MapPin, Clock, Truck, Home, PackageCheck, Circle } from 'lucide-react';
import { fetchAdminOrders, updateOrderStatus, updateOrderTracking, deleteOrder } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { formatPrice, STATUS_LABELS, STATUS_COLORS } from '../../lib/types';
import type { Order } from '../../lib/types';

const TRACKING_STEPS = [
  { key: 'ontvangen',  label: 'Ontvangen',  icon: PackageCheck },
  { key: 'verwerkt',   label: 'Verwerkt',   icon: Package },
  { key: 'voorbereid', label: 'Voorbereid', icon: PackageCheck },
  { key: 'verzonden',  label: 'Verzonden',  icon: Truck },
  { key: 'afgeleverd', label: 'Afgeleverd', icon: Home },
];

function getTrackingStepIndex(status: string): number {
  const idx = TRACKING_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : -1;
}

function TrackingProgressBar({ status }: { status: string }) {
  const currentIdx = getTrackingStepIndex(status);

  if (status === 'geannuleerd') {
    return <span className="text-xs font-medium text-red-600">Geannuleerd</span>;
  }
  if (status === 'nieuw' || status === 'in_behandeling') {
    return <span className="text-xs font-medium text-amber-600">Wacht op betaling</span>;
  }
  if (currentIdx < 0) {
    return <span className="text-xs font-medium text-stone-400">{STATUS_LABELS[status] ?? status}</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      {TRACKING_STEPS.map((step, idx) => {
        const isDone = idx <= currentIdx;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center gap-1.5">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ${
                isDone
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-stone-200 bg-white text-stone-300'
              }`}
              title={step.label}
            >
              <Icon className="h-3 w-3" />
            </div>
            {idx < TRACKING_STEPS.length - 1 && (
              <div className={`h-0.5 w-4 rounded-full transition-colors duration-300 ${
                idx < currentIdx ? 'bg-green-600' : 'bg-stone-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TrackingTimeline({ status, paidAt }: { status: string; paidAt: string | null }) {
  const currentIdx = getTrackingStepIndex(status);

  if (status === 'geannuleerd') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
        <Circle className="h-5 w-5 text-red-500" />
        <p className="text-sm font-medium text-red-700">Deze bestelling is geannuleerd.</p>
      </div>
    );
  }

  if (status === 'nieuw' || status === 'in_behandeling') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-4">
        <Clock className="h-5 w-5 text-amber-500" />
        <p className="text-sm font-medium text-amber-700">
          Betaling in afwachting — tracking start zodra de betaling is bevestigd.
        </p>
      </div>
    );
  }

  if (currentIdx < 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-stone-50 p-4">
        <Package className="h-5 w-5 text-stone-400" />
        <p className="text-sm text-stone-500">Status: {STATUS_LABELS[status] ?? status}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-stone-200" />
      <div className="space-y-5">
        {TRACKING_STEPS.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = step.icon;

          let dateLabel = '';
          if (paidAt && isDone) {
            const paidDate = new Date(paidAt);
            // Steps advance every 8 hours (matches the advance-tracking edge function)
            const stepDate = new Date(paidDate.getTime() + idx * 8 * 60 * 60 * 1000);
            dateLabel = stepDate.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          }

          return (
            <div key={step.key} className="relative flex items-start gap-4">
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isDone
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-stone-200 bg-white text-stone-300'
                } ${isCurrent ? 'ring-4 ring-green-50' : ''}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className={`flex-1 pt-1 ${isDone ? 'opacity-100' : 'opacity-50'}`}>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${isDone ? 'text-stone-900' : 'text-stone-400'}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                      Huidig
                    </span>
                  )}
                  {dateLabel && (
                    <span className="text-xs text-stone-400">{dateLabel}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  useEffect(() => { load(); }, []);

  // Realtime: auto-refresh the orders list when a new order arrives
  // or an existing order's status changes.
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const newRow = payload.new as Record<string, unknown> | undefined;
          const oldRow = payload.old_record as Record<string, unknown> | undefined;
          if (!newRow) return;
          const id = newRow.id as string;
          const newStatus = newRow.status as string | undefined;
          const oldStatus = oldRow?.status as string | undefined;

          if (newStatus !== oldStatus) {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === id
                  ? { ...o, status: newStatus ?? o.status }
                  : o,
              ),
            );
            if (selected?.id === id) {
              setSelected((prev) =>
                prev ? { ...prev, status: newStatus ?? prev.status } : prev,
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected?.id]);

  const load = async () => {
    setLoading(true);
    try { setOrders(await fetchAdminOrders()); }
    catch { /* fail silently */ }
    finally { setLoading(false); }
  };

  const changeStatus = async (id: string, status: string) => {
    try {
      await updateOrderStatus(id, status);
      const isPaid = ['betaald', 'verzonden', 'afgerond', 'ontvangen', 'verwerkt', 'voorbereid', 'afgeleverd'].includes(status);
      const paymentStatus = isPaid ? 'paid' : 'pending';
      setOrders(orders.map((o) => (o.id === id ? { ...o, status, payment_status: paymentStatus } : o)));
      if (selected?.id === id) setSelected({ ...selected, status, payment_status: paymentStatus });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status bijwerken mislukt.');
    }
  };

  const handleDelete = async (id: string, orderNumber: string) => {
    if (!confirm(`Weet je zeker dat je bestelling ${orderNumber} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    try {
      await deleteOrder(id);
      setOrders(orders.filter((o) => o.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bestelling verwijderen mislukt.');
    }
  };

  const saveTracking = async () => {
    if (!selected) return;
    try {
      await updateOrderTracking(selected.id, trackingInput);
      setOrders(orders.map((o) => (o.id === selected.id ? { ...o, tracking_number: trackingInput } : o)));
      setSelected({ ...selected, tracking_number: trackingInput });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Tracking opslaan mislukt.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-stone-300 border-t-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-900">Bestellingen ({orders.length})</h2>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-stone-400">
          <Package className="h-12 w-12 mb-3" />
          <p className="text-sm">Nog geen bestellingen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900">{o.order_number}</p>
                  <p className="text-xs text-stone-400 truncate">{o.customer_email} &middot; {new Date(o.created_at).toLocaleDateString('nl-NL')}</p>
                </div>
                <span className={`badge border ${STATUS_COLORS[o.status] ?? ''}`}>{STATUS_LABELS[o.status] ?? o.status}</span>
                <span className="text-sm font-semibold text-stone-900 hidden sm:block">{formatPrice(o.total)}</span>
                <button onClick={() => { setSelected(o); setTrackingInput(o.tracking_number ?? ''); }} className="rounded-md p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900">
                  <Eye className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(o.id, o.order_number)} className="rounded-md p-2 text-stone-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {/* Tracking progress bar */}
              <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-stone-400">Track &amp; Trace</span>
                  {o.tracking_code && (
                    <span className="font-mono text-xs text-stone-500">{o.tracking_code}</span>
                  )}
                </div>
                <TrackingProgressBar status={o.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setSelected(null)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-stone-900">Bestelling {selected.order_number}</h3>
              <button onClick={() => setSelected(null)} className="text-stone-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-stone-400 mb-1">Klant</p>
                <p className="font-medium text-stone-900">{selected.customer_first_name} {selected.customer_last_name}</p>
                <p className="text-stone-600">{selected.customer_email}</p>
                {selected.customer_phone && <p className="text-stone-600">{selected.customer_phone}</p>}
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-1">Bezorgadres</p>
                {(() => {
                  const a = selected.shipping_address as Record<string, string> | null;
                  if (!a) return <p className="text-stone-600">Geen adres opgegeven</p>;
                  return (
                    <p className="text-stone-600 whitespace-pre-line">
                      {a.street} {a.houseNumber}
                      {'\n'}{a.postalCode} {a.city}
                      {'\n'}{a.country}
                    </p>
                  );
                })()}
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-1">Producten</p>
                <div className="space-y-1">
                  {selected.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-stone-600">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span>{formatPrice(item.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-stone-100 space-y-1">
                  <div className="flex justify-between text-stone-500"><span>Subtotaal</span><span>{formatPrice(selected.subtotal)}</span></div>
                  <div className="flex justify-between text-stone-500"><span>Verzending</span><span>{formatPrice(selected.shipping_cost)}</span></div>
                  <div className="flex justify-between font-semibold text-stone-900"><span>Totaal</span><span>{formatPrice(selected.total)}</span></div>
                </div>
              </div>

              {/* Tracking timeline */}
              <div>
                <p className="text-xs text-stone-400 mb-2">Track &amp; Trace voortgang</p>
                <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                  <TrackingTimeline status={selected.status} paidAt={selected.paid_at ?? null} />
                </div>
                {selected.tracking_code && (
                  <p className="mt-2 text-xs text-stone-500">
                    Track &amp; trace code: <span className="font-mono font-medium text-stone-700">{selected.tracking_code}</span>
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-stone-400 mb-1">Status</p>
                <select value={selected.status} onChange={(e) => changeStatus(selected.id, e.target.value)} className="input-field">
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-1">Tracking nummer</p>
                <div className="flex gap-2">
                  <input type="text" value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} className="input-field" placeholder="Track & trace" />
                  <button onClick={saveTracking} className="btn-outline shrink-0">Opslaan</button>
                </div>
              </div>
              {selected.notes && (
                <div>
                  <p className="text-xs text-stone-400 mb-1">Opmerkingen</p>
                  <p className="text-stone-600">{selected.notes}</p>
                </div>
              )}
              <div className="border-t border-stone-200 pt-4">
                <button onClick={() => handleDelete(selected.id, selected.order_number)} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" /> Bestelling verwijderen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
