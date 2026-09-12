import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { fetchAdminPayments, fetchAdminPaymentProviders, updatePaymentProvider } from '../../lib/api';
import { formatPrice, PAYMENT_STATUS_LABELS } from '../../lib/types';
import type { Payment, PaymentProvider } from '../../lib/types';

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [p, pp] = await Promise.all([fetchAdminPayments(), fetchAdminPaymentProviders()]);
      setPayments(p);
      setProviders(pp);
    } catch { /* fail silently */ }
    finally { setLoading(false); }
  };

  const toggleProvider = async (id: string, enabled: boolean) => {
    try {
      await updatePaymentProvider(id, { is_enabled: enabled });
      setProviders(providers.map((p) => (p.id === id ? { ...p, is_enabled: enabled } : p)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bijwerken mislukt.');
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Betalingen ({payments.length})</h2>
        <div className="mt-4 rounded-xl border border-stone-200 bg-white overflow-hidden">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-stone-400">
              <CreditCard className="h-12 w-12 mb-3" />
              <p className="text-sm">Nog geen betalingen.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-4 text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-stone-900">{(p as Payment & { order?: { order_number?: string } }).order?.order_number ?? p.order_id}</p>
                    <p className="text-xs text-stone-400">{new Date(p.created_at).toLocaleDateString('nl-NL')}</p>
                  </div>
                  <span className="text-stone-600">{p.provider_code}</span>
                  <span className={`badge ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{PAYMENT_STATUS_LABELS[p.status] ?? p.status}</span>
                  <span className="font-semibold text-stone-900">{formatPrice(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-stone-900">Betaalproviders</h2>
        <div className="mt-4 rounded-xl border border-stone-200 bg-white overflow-hidden">
          <div className="divide-y divide-stone-100">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-stone-900">{p.name}</p>
                  <p className="text-xs text-stone-400">{p.code} &middot; {p.mode}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" checked={p.is_enabled} onChange={(e) => toggleProvider(p.id, e.target.checked)} className="peer sr-only" />
                  <div className="h-6 w-11 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent-600 peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
            {providers.length === 0 && <p className="p-8 text-center text-sm text-stone-400">Geen betaalproviders geconfigureerd.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
