import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Lock, ArrowRight, Check, Truck, RotateCcw, BadgeCheck, LogOut } from 'lucide-react';
import { Seo } from '../components/Seo';
import { useCart } from '../lib/cart';
import { createOrder } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatPrice } from '../lib/types';

const PAYMENT_METHODS = [
  { id: 'ideal', label: 'iDEAL', desc: 'Direct betalen via je Nederlandse bank', icon: 'ideal' },
  { id: 'bancontact', label: 'Bancontact', desc: 'Direct betalen via je Belgische bank', icon: 'bancontact' },
];

async function initiateMovePayment(params: {
  orderId: string;
  amount: number;
  method: string;
  payerName: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ redirect_url: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const moveId = import.meta.env.VITE_MOVEPAYMENT_MOVE_ID as string;

  const res = await fetch(`${supabaseUrl}/functions/v1/movepayment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      orderId: params.orderId,
      amount: params.amount,
      moveId,
      method: params.method,
      payerName: params.payerName,
      languageCode: 'nl',
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Move Payment fout (${res.status})`);
  if (!json.redirect_url) throw new Error('Geen betaal-URL ontvangen van Move Payment.');
  return { redirect_url: json.redirect_url };
}

export default function Checkout() {
  const { items, subtotal, shipping, total, clear } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGuest = searchParams.get('guest') === 'true';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    if (!user && !isGuest) {
      navigate('/checkout/gate', { replace: true });
    }
  }, [user, isGuest, navigate]);

  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    country: 'Nederland',
    notes: '',
    paymentMethod: 'ideal',
  });

  useEffect(() => {
    if (profile) {
      const metaFirstName = user?.user_metadata?.given_name ?? user?.user_metadata?.first_name ?? '';
      const metaLastName = user?.user_metadata?.family_name ?? user?.user_metadata?.last_name ?? '';
      const metaFull = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '';
      let firstName = profile.first_name || metaFirstName || '';
      let lastName = profile.last_name || metaLastName || '';
      if (!firstName && !lastName && metaFull) {
        firstName = metaFull.split(' ')[0];
        lastName = metaFull.split(' ').slice(1).join(' ');
      }
      setForm((prev) => ({
        ...prev,
        email: profile.email,
        firstName,
        lastName,
        phone: profile.phone ?? prev.phone,
        street: profile.street ?? prev.street,
        houseNumber: profile.house_number ?? prev.houseNumber,
        postalCode: profile.postal_code ?? prev.postalCode,
        city: profile.city ?? prev.city,
        country: profile.country ?? prev.country,
      }));
    } else if (user) {
      const metaFirstName = user.user_metadata?.given_name ?? user.user_metadata?.first_name ?? '';
      const metaLastName = user.user_metadata?.family_name ?? user.user_metadata?.last_name ?? '';
      const metaFull = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
      let firstName = metaFirstName;
      let lastName = metaLastName;
      if (!firstName && !lastName && metaFull) {
        firstName = metaFull.split(' ')[0];
        lastName = metaFull.split(' ').slice(1).join(' ');
      }
      setForm((prev) => ({
        ...prev,
        email: user.email ?? prev.email,
        firstName: firstName || prev.firstName,
        lastName: lastName || prev.lastName,
      }));
    }
  }, [profile, user]);

  const handleLogout = async () => {
    await signOut();
    setForm((prev) => ({ ...prev, email: '', firstName: '', lastName: '', phone: '', street: '', houseNumber: '', postalCode: '', city: '' }));
  };

  if (items.length === 0) {
    return (
      <>
        <Seo title="Afrekenen" url="/checkout" />
        <div className="container-content flex flex-col items-center justify-center py-20 text-center">
          <h1 className="text-2xl font-bold text-stone-900">Je winkelwagen is leeg</h1>
          <Link to="/products" className="mt-6 btn-primary">Bekijk gitaren</Link>
        </div>
      </>
    );
  }

  const set = (key: string, value: string) => setForm({ ...form, [key]: value });

  const errors: Record<string, string> = {};
  if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.email = 'Vul een geldig e-mailadres in.';
  if (form.postalCode && !/^\d{4}\s?[A-Z]{2}$/i.test(form.postalCode) && !/^\d{4}$/.test(form.postalCode.replace(/\s/g, ''))) errors.postalCode = 'Vul een geldige postcode in (bijv. 1234 AB).';
  if (form.phone && form.phone.replace(/[\s\-+()]/g, '').length < 10) errors.phone = 'Vul een geldig telefoonnummer in.';
  if (form.houseNumber && !/\d/.test(form.houseNumber)) errors.houseNumber = 'Huisnummer moet een getal bevatten.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) { setError('Vul een geldig e-mailadres in.'); return; }
      if (!form.firstName.trim() || !form.lastName.trim()) { setError('Vul je voor- en achternaam in.'); return; }
    } else {
      if (!form.firstName.trim() || !form.lastName.trim()) { setError('Vul je voor- en achternaam in onder je profiel of in het formulier.'); return; }
    }
    if (form.phone && form.phone.replace(/[\s\-+()]/g, '').length < 10) { setError('Vul een geldig telefoonnummer in.'); return; }
    if (!/\d/.test(form.houseNumber)) { setError('Huisnummer moet een getal bevatten.'); return; }
    if (!/^\d{4}\s?[A-Z]{2}$/i.test(form.postalCode) && !/^\d{4}$/.test(form.postalCode.replace(/\s/g, ''))) { setError('Vul een geldige postcode in.'); return; }
    if (!form.street.trim() || !form.city.trim()) { setError('Vul straat en plaats in.'); return; }
    await placeOrder(form.paymentMethod);
  };

  const placeOrder = async (paymentMethod: string) => {
    setLoading(true);
    try {
      const result = await createOrder({
        customer_email: user?.email ?? form.email,
        customer_first_name: form.firstName,
        customer_last_name: form.lastName,
        customer_phone: form.phone,
        shipping_address: {
          street: form.street,
          houseNumber: form.houseNumber,
          postalCode: form.postalCode,
          city: form.city,
          country: form.country,
        },
        items: items.map((i) => ({
          product_id: i.productId,
          product_name: i.name,
          product_slug: i.slug,
          quantity: i.quantity,
          unit_price: i.price,
          total: i.price * i.quantity,
        })),
        subtotal,
        shipping_cost: shipping,
        total,
        payment_method: paymentMethod,
        notes: form.notes,
        pending: true,
      });

      const origin = window.location.origin;
      const successUrl = `${origin}/checkout/success?order=${encodeURIComponent(result.order_number)}&tracking=${encodeURIComponent(result.tracking_code)}`;
      const cancelUrl = `${origin}/checkout?guest=${isGuest ? 'true' : 'false'}`;

      // iDEAL: open the integrated WaveGitaar payment page.
      // Bancontact continues to use the existing MovePayment integration.
      if (paymentMethod === 'ideal') {
        clear();
        navigate(`/ideal-betalen?amount=${encodeURIComponent(total.toFixed(2))}&order=${encodeURIComponent(result.order_number)}&tracking=${encodeURIComponent(result.tracking_code)}`);
        return;
      }

      const { redirect_url } = await initiateMovePayment({
        orderId: result.order_number,
        amount: total,
        method: paymentMethod,
        payerName: `${form.firstName} ${form.lastName}`.trim(),
        successUrl,
        cancelUrl,
      });

      clear();
      window.location.href = redirect_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis bij het plaatsen van je bestelling.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Afrekenen" url="/checkout" />
      <div className="border-b border-stone-200 bg-stone-50">
        <div className="container-content py-8">
          <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">Afrekenen</h1>
        </div>
      </div>

      <div className="container-content py-8">
        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {(!user || !form.firstName.trim() || !form.lastName.trim()) && (
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="mb-4 text-lg font-semibold text-stone-900">Contactgegevens</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {!user && (
                    <div className="sm:col-span-2">
                      <label className="input-label">E-mailadres *</label>
                      <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className="input-field" />
                      {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                    </div>
                  )}
                  <div>
                    <label className="input-label">Voornaam *</label>
                    <input type="text" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="input-label">Achternaam *</label>
                    <input type="text" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className="input-field" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="input-label">Telefoonnummer</label>
                    <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className="input-field" placeholder="06 12345678" />
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                  </div>
                </div>
              </div>
            )}

            {user && (
              <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-5 py-4">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  <span>Ingelogd als <strong>{user.email}</strong></span>
                </div>
                <button type="button" onClick={handleLogout} className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700">
                  <LogOut className="h-3.5 w-3.5" /> Uitloggen
                </button>
              </div>
            )}

            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-stone-900">Bezorgadres</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="input-label">Straatnaam *</label>
                  <input type="text" required value={form.street} onChange={(e) => set('street', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Huisnummer *</label>
                  <input type="text" required value={form.houseNumber} onChange={(e) => set('houseNumber', e.target.value)} className="input-field" placeholder="42A" />
                  {errors.houseNumber && <p className="mt-1 text-xs text-red-600">{errors.houseNumber}</p>}
                </div>
                <div>
                  <label className="input-label">Postcode *</label>
                  <input type="text" required value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} className="input-field" placeholder="1234 AB" />
                  {errors.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>}
                </div>
                <div>
                  <label className="input-label">Plaats *</label>
                  <input type="text" required value={form.city} onChange={(e) => set('city', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Land *</label>
                  <select value={form.country} onChange={(e) => set('country', e.target.value)} className="input-field">
                    <option>Nederland</option>
                    <option>België</option>
                    <option>Duitsland</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="input-label">Opmerkingen</label>
                  <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="input-field" rows={3} placeholder="Bijv. afleverinstructies" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-stone-900">Betaalmethode</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <label key={m.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${form.paymentMethod === m.id ? 'border-stone-900 bg-stone-100' : 'border-stone-200 hover:border-stone-300'}`}>
                    <input type="radio" name="payment" value={m.id} checked={form.paymentMethod === m.id} onChange={(e) => set('paymentMethod', e.target.value)} className="accent-stone-900" />
                    <div className="flex h-8 w-20 shrink-0 items-center justify-center gap-1 rounded bg-white shadow-sm">
                      {m.icon === 'ideal' && <img src="/ideal-wero-logo.svg" alt={m.label} className="max-h-6 max-w-10 object-contain" />}
                      {m.icon === 'bancontact' && <img src="/bancontact.svg" alt={m.label} className="max-h-5 max-w-10 object-contain" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-900">{m.label}</p>
                      <p className="text-xs text-stone-500">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-stone-900">Jouw bestelling</h2>
              <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.key} className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                      {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-600 px-1 text-xs font-semibold text-white">{item.quantity}</span>
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-stone-900 leading-snug">{item.name}</p>
                      <p className="text-stone-500">{formatPrice(item.price)} x {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-stone-900">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-stone-200 pt-3 text-sm">
                <div className="flex justify-between text-stone-600"><span>Subtotaal</span><span className="font-medium text-stone-900">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-stone-600"><span>Verzending</span><span className="font-medium text-green-600">Gratis</span></div>
                <div className="border-t border-stone-200 pt-2 flex justify-between text-base"><span className="font-semibold">Totaal</span><span className="font-bold text-stone-900">{formatPrice(total)}</span></div>
              </div>

              {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <button type="submit" disabled={loading} className="mt-5 w-full btn-primary justify-center">
                {loading ? 'Bezig...' : <>Plaats bestelling <ArrowRight className="h-4 w-4" /></>}
              </button>
              <div className="mt-4 space-y-2 border-t border-stone-200 pt-4">
                {[
                  { icon: Lock, text: 'Veilig afrekenen met SSL-versleuteling' },
                  { icon: Shield, text: '3 jaar garantie inbegrepen' },
                  { icon: Truck, text: 'Vóór 21:59 besteld = morgen in huis' },
                  { icon: RotateCcw, text: '30 dagen retourrecht' },
                  { icon: BadgeCheck, text: 'Betrouwbaar & gewaarborgd — KvK 32137384' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-stone-500">
                    <b.icon className="h-3.5 w-3.5 shrink-0 text-stone-900" /> {b.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
