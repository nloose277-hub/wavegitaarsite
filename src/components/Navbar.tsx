import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, UserCircle, ChevronRight, Phone, Mail } from 'lucide-react';
import { useCart } from '../lib/cart';
import { searchProducts } from '../lib/api';
import type { Product } from '../lib/types';
import { Logo } from './Logo';

export function Navbar() {
  const { count } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { const r = await searchProducts(query); setResults(r); setShowResults(true); } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const navLinks = [
    { to: '/products', label: 'Alle gitaren' },
    { to: '/products?category=stratocaster', label: 'Stratocaster' },
    { to: '/products?category=telecaster', label: 'Telecaster' },
    { to: '/products?category=basgitaren', label: 'Basgitaren' },
    { to: '/products?category=versterkers', label: 'Versterkers' },
  ];
  const infoLinks = [
    { to: '/tracken', label: 'Track & Trace' },
    { to: '/over-ons', label: 'Over ons' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <>
      {/* Top bar — light gray */}
      <div className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
        <div className="container-content flex h-9 items-center justify-between gap-4">
          <span className="hidden sm:block">Vóór 21:59 besteld = morgen in huis · Gratis verzending · 3 jaar garantie</span>
          <span className="sm:hidden">Morgen in huis · 3 jaar garantie</span>
          <div className="flex items-center gap-4">
            <a href="tel:+31852126403" className="hidden items-center gap-1.5 font-medium text-stone-600 hover:text-stone-900 sm:flex">
              <Phone className="h-3 w-3" /> +31 85 212 6403
            </a>
            <a href="mailto:info@wavegitaar.nl" className="hidden items-center gap-1.5 font-medium text-stone-600 hover:text-stone-900 sm:flex">
              <Mail className="h-3 w-3" /> info@wavegitaar.nl
            </a>
          </div>
        </div>
      </div>

      {/* Main header — white, sticky */}
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="container-content">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Logo className="h-8 w-8" />
              <span className="text-lg font-bold tracking-tight text-stone-900">WaveGitaar</span>
            </Link>

            {/* Desktop search */}
            <div className="relative hidden flex-1 max-w-md md:block">
              <input
                type="text" value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                placeholder="Zoek gitaren, merken, modellen..."
                className="w-full rounded-lg border border-stone-300 bg-stone-50 px-4 py-2.5 pr-10 text-sm text-stone-900 placeholder-stone-400 transition-colors focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              <Search className="absolute right-3 top-3 h-4 w-4 text-stone-400" />
              {showResults && results.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
                  {results.slice(0, 6).map((p) => (
                    <button key={p.id} onClick={() => { navigate(`/products/${p.slug}`); setQuery(''); setShowResults(false); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0">
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-stone-900">{p.name}</span>
                        <span className="block text-xs text-stone-500">{p.brand}</span>
                      </span>
                      <span className="text-sm font-bold text-stone-900">€{p.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Link to="/account" className="hidden rounded-lg p-2.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 sm:block" aria-label="Account">
                <UserCircle className="h-5 w-5" />
              </Link>
              <Link to="/cart" className="relative rounded-lg p-2.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900" aria-label="Winkelwagen">
                <ShoppingBag className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-600 px-1 text-xs font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
              <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 md:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Category nav (desktop) */}
          <nav className="hidden h-11 items-center gap-6 border-t border-stone-100 md:flex">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900">{l.label}</Link>
            ))}
            <div className="ml-auto flex items-center gap-5">
              {infoLinks.map((l) => (
                <Link key={l.to} to={l.to} className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900">{l.label}</Link>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile search */}
      <div className="border-b border-stone-200 bg-white px-4 py-2.5 md:hidden">
        <div className="relative">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek gitaren..."
            className="w-full rounded-lg border border-stone-300 bg-stone-50 px-4 py-2.5 pr-10 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:bg-white focus:outline-none" />
          <Search className="absolute right-3 top-3 h-4 w-4 text-stone-400" />
        </div>
        {showResults && results.length > 0 && (
          <div className="mt-1.5 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
            {results.slice(0, 5).map((p) => (
              <button key={p.id} onClick={() => { navigate(`/products/${p.slug}`); setQuery(''); setShowResults(false); }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 border-b border-stone-100 last:border-b-0">
                <span className="flex-1 text-sm font-medium text-stone-900">{p.name}</span>
                <span className="text-sm font-bold text-stone-900">€{p.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-white" onClick={() => setMobileOpen(false)}>
          <div className="container-content pt-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 text-stone-900" onClick={() => setMobileOpen(false)}>
                <Logo className="h-8 w-8" /><span className="text-lg font-bold">WaveGitaar</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-400">Assortiment</p>
            <nav className="flex flex-col gap-0.5">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100">
                  {l.label}<ChevronRight className="h-4 w-4 text-stone-400" />
                </Link>
              ))}
            </nav>
            <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-stone-400">Informatie</p>
            <nav className="flex flex-col gap-0.5">
              {infoLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100">
                  {l.label}<ChevronRight className="h-4 w-4 text-stone-400" />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
