import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageCircle, ShieldCheck, Truck, RotateCcw, Lock, Phone } from 'lucide-react';
import { Logo } from './Logo';
import { PaymentLogos } from './PaymentLogos';

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      {/* Trust bar */}
      <div className="border-b border-stone-200">
        <div className="container-content grid grid-cols-2 gap-4 py-6 md:grid-cols-4">
          {[
            { icon: ShieldCheck, label: 'Betrouwbaar', sub: 'KvK 32137384' },
            { icon: Lock, label: 'Veilig betalen', sub: 'SSL versleuteld' },
            { icon: Truck, label: 'Morgen in huis', sub: 'Vóór 21:59 besteld' },
            { icon: RotateCcw, label: '30 dagen retour', sub: 'Geld terug garantie' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <b.icon className="h-5 w-5 shrink-0 text-accent-600" />
              <div>
                <p className="text-xs font-semibold text-stone-900">{b.label}</p>
                <p className="text-xs text-stone-500">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-content py-12">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="text-lg font-bold text-stone-900">WaveGitaar</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-stone-500 max-w-xs">
              De Nederlandse specialist in elektrische gitaren. Stratocaster, Telecaster, basgitaren en versterkers.
            </p>
          </div>

          <div className="md:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-stone-900">Shop</h3>
            <ul className="space-y-2 text-sm text-stone-500">
              <li><Link to="/products?category=stratocaster" className="hover:text-stone-900 transition-colors">Stratocaster</Link></li>
              <li><Link to="/products?category=telecaster" className="hover:text-stone-900 transition-colors">Telecaster</Link></li>
              <li><Link to="/products?category=basgitaren" className="hover:text-stone-900 transition-colors">Basgitaren</Link></li>
              <li><Link to="/products?category=versterkers" className="hover:text-stone-900 transition-colors">Versterkers</Link></li>
              <li><Link to="/products" className="hover:text-stone-900 transition-colors">Alle gitaren</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-stone-900">Klantenservice</h3>
            <ul className="space-y-2 text-sm text-stone-500">
              <li><Link to="/tracken" className="hover:text-stone-900 transition-colors">Track &amp; Trace</Link></li>
              <li><Link to="/contact" className="hover:text-stone-900 transition-colors">Contact</Link></li>
              <li><Link to="/legal/verzending-retour" className="hover:text-stone-900 transition-colors">Verzending &amp; Retour</Link></li>
              <li><Link to="/legal/retourbeleid" className="hover:text-stone-900 transition-colors">Retourbeleid</Link></li>
              <li><Link to="/legal/algemene-voorwaarden" className="hover:text-stone-900 transition-colors">Algemene voorwaarden</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="mb-3 text-sm font-semibold text-stone-900">Contact</h3>
            <ul className="space-y-2.5 text-sm text-stone-500">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-accent-600" />
                <a href="tel:+31852126403" className="hover:text-stone-900 transition-colors">+31 85 212 6403</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-accent-600" />
                <a href="mailto:info@wavegitaar.nl" className="hover:text-stone-900 transition-colors">info@wavegitaar.nl</a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 shrink-0 text-accent-600" />
                <span>WhatsApp &amp; e-mail</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-accent-600" />
                <span>Eastein 18, 9136RD Peazens, NL</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-stone-200 pt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Veilig betalen</p>
          <PaymentLogos />
        </div>

        <div className="mt-6 border-t border-stone-200 pt-6 text-xs text-stone-400">
          &copy; {new Date().getFullYear()} WaveGitaar · KvK 32137384 · Alle rechten voorbehouden
        </div>
      </div>
    </footer>
  );
}
