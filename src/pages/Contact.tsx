import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Send, Check, MessageCircle, Clock, Phone } from 'lucide-react';
import { Seo } from '../components/Seo';
import { supabase } from '../lib/supabase';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Vul alle velden in.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { error: dbError } = await supabase.from('contact_messages').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      if (dbError) throw dbError;
      setSent(true);
    } catch {
      setError('Er ging iets mis. Probeer het later opnieuw of mail naar info@wavegitaar.nl.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Contact" description="Neem contact op met WaveGitaar — de gitaarspecialist van Nederland. We helpen je graag bij het kiezen van de juiste gitaar." url="/contact" />

      {/* Breadcrumb */}
      <div className="border-b border-stone-200 bg-white">
        <div className="container-content py-3">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Link to="/" className="hover:text-stone-900">Home</Link>
            <span>/</span>
            <span className="text-stone-900 font-medium">Contact</span>
          </div>
        </div>
      </div>

      {/* Header — white */}
      <div className="border-b border-stone-200 bg-white">
        <div className="container-content py-6 md:py-8">
          <h1 className="text-xl font-bold text-stone-900 md:text-2xl">Contact</h1>
          <p className="mt-1 max-w-xl text-sm text-stone-500">
            Heb je een vraag over een gitaar of hulp nodig bij het kiezen? Neem contact op — we helpen je graag persoonlijk.
          </p>
        </div>
      </div>

      <div className="bg-stone-50 py-8 md:py-10">
        <div className="container-content">
          <div className="grid gap-6 md:grid-cols-5">
            {/* Contact info */}
            <div className="md:col-span-2">
              <div className="space-y-3">
                {[
                  { icon: Phone, label: 'Telefoon', value: '+31 85 212 6403', href: 'tel:+31852126403' },
                  { icon: Mail, label: 'E-mail', value: 'info@wavegitaar.nl', href: 'mailto:info@wavegitaar.nl' },
                  { icon: MessageCircle, label: 'WhatsApp', value: 'Chat via de WhatsApp knop rechtsonder', href: null },
                  { icon: MapPin, label: 'Adres', value: 'Eastein 18, 9136RD Peazens, Nederland', href: null },
                ].map((c, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                      <c.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-stone-400">{c.label}</p>
                      {c.href ? (
                        <a href={c.href} className="text-sm font-bold text-stone-900 hover:text-accent-700">{c.value}</a>
                      ) : (
                        <p className="text-sm font-bold text-stone-900">{c.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Opening hours — light card */}
              <div className="mt-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent-600" />
                  <h3 className="text-sm font-bold text-stone-900">Openingstijden</h3>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm">
                  <li className="flex justify-between text-stone-500"><span>Ma - vr</span><span className="font-medium text-stone-900">9:00 - 18:00</span></li>
                  <li className="flex justify-between text-stone-500"><span>Zaterdag</span><span className="font-medium text-stone-900">10:00 - 16:00</span></li>
                  <li className="flex justify-between text-stone-500"><span>Zondag</span><span className="font-bold text-red-500">Gesloten</span></li>
                </ul>
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-3">
              <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm md:p-8">
                {sent ? (
                  <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Check className="h-8 w-8" strokeWidth={3} />
                    </div>
                    <h2 className="mt-5 text-xl font-bold text-stone-900">Bericht verzonden!</h2>
                    <p className="mt-2 text-sm text-stone-500">We nemen zo snel mogelijk contact met je op.</p>
                    <Link to="/" className="mt-5 text-sm font-bold text-accent-600 hover:text-accent-700">Terug naar home</Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <h2 className="text-lg font-bold text-stone-900">Stuur ons een bericht</h2>
                    <p className="mt-1 text-sm text-stone-500">We reageren meestal binnen 24 uur.</p>
                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="input-label">Naam *</label>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
                      </div>
                      <div>
                        <label className="input-label">E-mailadres *</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required />
                      </div>
                      <div>
                        <label className="input-label">Bericht *</label>
                        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-field min-h-36" rows={6} required />
                      </div>
                      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
                      <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-700 disabled:opacity-40">
                        {submitting ? 'Verzenden…' : 'Verzenden'} <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
