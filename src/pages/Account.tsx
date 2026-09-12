import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut, ArrowRight, Check, Package } from 'lucide-react';
import { Seo } from '../components/Seo';
import { supabase } from '../lib/supabase';
import { useAuth, type Profile } from '../lib/auth';
import { formatPrice } from '../lib/types';
import type { Order } from '../lib/types';

export default function Account() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const [form, setForm] = useState<Profile | null>(null);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setOrders((data ?? []) as Order[]));
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-stone-300 border-t-accent-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Seo title="Mijn account" url="/account" />
        <div className="container-content flex flex-col items-center justify-center py-20 text-center">
          <UserIcon className="h-12 w-12 text-stone-300" />
          <h1 className="mt-4 text-xl font-bold text-stone-900">Je bent niet ingelogd</h1>
          <p className="mt-2 text-sm text-stone-500">Log in om je account en bestellingen te bekijken.</p>
          <div className="mt-6 flex gap-3">
            <Link to="/login" className="btn-primary">Inloggen</Link>
            <Link to="/register" className="btn-secondary">Account aanmaken</Link>
          </div>
        </div>
      </>
    );
  }

  const set = (key: keyof Profile, value: string) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      title: form.title,
      first_name: form.first_name,
      infix: form.infix,
      last_name: form.last_name,
      country: form.country,
      postal_code: form.postal_code,
      house_number: form.house_number,
      street: form.street,
      city: form.city,
      phone: form.phone,
      birth_date: form.birth_date,
    }).eq('id', user.id);
    setSaving(false);
    if (error) {
      alert('Opslaan mislukt: ' + error.message);
    } else {
      await refreshProfile();
      setEditing(false);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 transition-colors focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 focus:outline-none';
  const labelClass = 'mb-1 block text-xs font-medium text-stone-600';

  const fullName = profile ? `${profile.first_name} ${profile.infix ? profile.infix + ' ' : ''}${profile.last_name}`.trim() : user.email;

  return (
    <>
      <Seo title="Mijn account" url="/account" />
      <div className="border-b border-stone-200 bg-stone-50">
        <div className="container-content py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">Mijn account</h1>
              <p className="mt-1 text-sm text-stone-500">{fullName}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
            >
              <LogOut className="h-4 w-4" /> Uitloggen
            </button>
          </div>
        </div>
      </div>

      <div className="container-content py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900">Profielgegevens</h2>
                {savedMsg && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" /> Opgeslagen
                  </span>
                )}
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="text-sm font-medium text-accent-700 hover:text-accent-800">
                    Bewerken
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(false); setForm(profile); }} className="text-sm text-stone-500 hover:text-stone-700">
                      Annuleren
                    </button>
                    <button onClick={handleSave} disabled={saving} className="text-sm font-medium text-accent-700 hover:text-accent-800">
                      {saving ? 'Opslaan...' : 'Opslaan'}
                    </button>
                  </div>
                )}
              </div>

              {form ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>E-mailadres</label>
                    <input type="email" value={form.email} disabled className={inputClass + ' bg-stone-100 text-stone-500'} />
                  </div>
                  <div>
                    <label className={labelClass}>Voornaam</label>
                    <input type="text" value={form.first_name} disabled={!editing} onChange={(e) => set('first_name', e.target.value)} className={inputClass + (!editing ? ' bg-stone-50' : '')} />
                  </div>
                  <div>
                    <label className={labelClass}>Tussenvoegsel</label>
                    <input type="text" value={form.infix ?? ''} disabled={!editing} onChange={(e) => set('infix', e.target.value)} className={inputClass + (!editing ? ' bg-stone-50' : '')} />
                  </div>
                  <div>
                    <label className={labelClass}>Achternaam</label>
                    <input type="text" value={form.last_name} disabled={!editing} onChange={(e) => set('last_name', e.target.value)} className={inputClass + (!editing ? ' bg-stone-50' : '')} />
                  </div>
                  <div>
                    <label className={labelClass}>Land</label>
                    <select value={form.country} disabled={!editing} onChange={(e) => set('country', e.target.value)} className={inputClass + (!editing ? ' bg-stone-50' : '')}>
                      <option>Nederland</option>
                      <option>België</option>
                      <option>Anders</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Postcode</label>
                    <input type="text" value={form.postal_code ?? ''} disabled={!editing} onChange={(e) => set('postal_code', e.target.value)} className={inputClass + (!editing ? ' bg-stone-50' : '')} />
                  </div>
                  <div>
                    <label className={labelClass}>Huisnummer</label>
                    <input type="text" value={form.house_number ?? ''} disabled={!editing} onChange={(e) => set('house_number', e.target.value)} className={inputClass + (!editing ? ' bg-stone-50' : '')} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Straatnaam</label>
                    <input type="text" value={form.street ?? ''} disabled={!editing} onChange={(e) => set('street', e.target.value)} className={inputClass + (!editing ? ' bg-stone-50' : '')} />
                  </div>
                  <div>
                    <label className={labelClass}>Plaats</label>
                    <input type="text" value={form.city ?? ''} disabled={!editing} onChange={(e) => set('city', e.target.value)} className={inputClass + (!editing ? ' bg-stone-50' : '')} />
                  </div>
                  <div>
                    <label className={labelClass}>Telefoonnummer</label>
                    <input type="tel" value={form.phone ?? ''} disabled={!editing} onChange={(e) => set('phone', e.target.value)} className={inputClass + (!editing ? ' bg-stone-50' : '')} />
                  </div>
                  <div>
                    <label className={labelClass}>Geboortedatum</label>
                    <input type="date" value={form.birth_date ?? ''} disabled={!editing} onChange={(e) => set('birth_date', e.target.value)} className={inputClass + (!editing ? ' bg-stone-50' : '')} />
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-stone-500">Je profiel is nog niet volledig ingevuld.</p>
                  <Link to="/register" className="mt-3 inline-block text-sm font-medium text-accent-700 hover:text-accent-800">
                    Vul je gegevens aan
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Orders */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-stone-900">
                <Package className="h-5 w-5" /> Bestellingen
              </h2>
              {orders.length === 0 ? (
                <p className="text-sm text-stone-500">Nog geen bestellingen.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/tracken/${order.tracking_code ?? ''}`}
                      className="block rounded-lg border border-stone-200 p-3 transition-colors hover:border-stone-300 hover:bg-stone-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-stone-900">{order.order_number}</span>
                        <span className="text-sm font-semibold text-stone-700">{formatPrice(order.total)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-stone-500">
                          {new Date(order.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="text-xs font-medium text-accent-700">Bekijk <ArrowRight className="inline h-3 w-3" /></span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
