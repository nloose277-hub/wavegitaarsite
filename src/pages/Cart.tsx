import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, Clock, Shield, RotateCcw, Lock, ChevronRight } from 'lucide-react';
import { Seo } from '../components/Seo';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/types';

export default function Cart() {
  const { items, remove, updateQty, subtotal, shipping, total } = useCart();

  if (items.length === 0) {
    return (
      <>
        <Seo title="Winkelwagen" url="/cart" />
        <div className="bg-stone-50">
          <div className="container-content flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
              <ShoppingBag className="h-10 w-10 text-stone-300" />
            </div>
            <h1 className="mt-6 text-xl font-bold text-stone-900">Je winkelwagen is leeg</h1>
            <p className="mt-2 text-sm text-stone-500">Bekijk ons assortiment en voeg een gitaar toe.</p>
            <Link to="/products" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-700">
              Bekijk gitaren <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title="Winkelwagen" url="/cart" />

      {/* Breadcrumb */}
      <div className="border-b border-stone-200 bg-white">
        <div className="container-content py-3">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Link to="/" className="hover:text-stone-900">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-stone-900 font-medium">Winkelwagen</span>
          </div>
        </div>
      </div>

      {/* Cart header — white */}
      <div className="border-b border-stone-200 bg-white">
        <div className="container-content py-6">
          <h1 className="text-xl font-bold text-stone-900 md:text-2xl">Winkelwagen</h1>
          <p className="mt-1 text-sm text-stone-500">Bijna klaar om af te rekenen</p>
        </div>
      </div>

      <div className="bg-stone-50 py-6 md:py-8">
        <div className="container-content">
          {/* Delivery info */}
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50 px-4 py-3">
              <Truck className="h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="text-sm font-bold text-green-900">Gratis verzending</p>
                <p className="text-xs text-green-700">Je bestelling wordt gratis verzonden</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
              <Clock className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">Morgen in huis</p>
                <p className="text-xs text-amber-700">Vóór 21:59 besteld = morgen geleverd. Weekend: 1-3 werkdagen.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                {items.map((item, idx) => (
                  <div key={item.key} className={`flex gap-4 p-4 md:p-5 ${idx !== 0 ? 'border-t border-stone-100' : ''}`}>
                    <Link to={`/products/${item.slug}`} className="shrink-0">
                      <div className="h-24 w-24 overflow-hidden rounded-lg bg-stone-100 md:h-28 md:w-28">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-300">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {item.brand && <p className="text-xs font-medium text-stone-400">{item.brand}</p>}
                          <Link to={`/products/${item.slug}`} className="text-sm font-bold text-stone-900 hover:text-accent-700">{item.name}</Link>
                          {item.variantLabel && <p className="mt-0.5 text-xs text-stone-500">{item.variantLabel}</p>}
                        </div>
                        <button onClick={() => remove(item.key)} className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600" aria-label="Verwijderen">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                        <div className="flex items-center rounded-lg border border-stone-300">
                          <button onClick={() => updateQty(item.key, item.quantity - 1)} className="px-3 py-2 text-stone-500 hover:text-stone-900"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-10 text-center text-sm font-bold text-stone-900">{item.quantity}</span>
                          <button onClick={() => updateQty(item.key, item.quantity + 1)} className="px-3 py-2 text-stone-500 hover:text-stone-900" disabled={item.quantity >= item.maxStock}><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-stone-900">{formatPrice(item.price * item.quantity)}</p>
                          {item.quantity > 1 && <p className="text-xs text-stone-400">{formatPrice(item.price)} per stuk</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/products" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700 hover:text-stone-900">
                <ChevronRight className="h-4 w-4 rotate-180" /> Verder winkelen
              </Link>
            </div>

            {/* Summary — white panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
                <div className="p-5 md:p-6">
                  <h2 className="text-base font-bold text-stone-900">Samenvatting</h2>

                  <div className="mt-4 space-y-2.5 text-sm">
                    <div className="flex justify-between text-stone-500">
                      <span>Subtotaal</span>
                      <span className="font-medium text-stone-900">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Verzending</span>
                      <span className="font-bold text-green-600">Gratis</span>
                    </div>

                    <div className="border-t border-stone-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-stone-900">Totaal</span>
                        <span className="text-lg font-bold text-stone-900">{formatPrice(total)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-stone-400">Inclusief BTW</p>
                    </div>
                  </div>

                  <Link to="/checkout/gate" className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-700">
                    Afrekenen <ArrowRight className="h-4 w-4" />
                  </Link>

                  <div className="mt-5 space-y-2 text-xs text-stone-500">
                    <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-accent-600" /> 3 jaar garantie</div>
                    <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-accent-600" /> Veilig betalen met iDEAL</div>
                    <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-accent-600" /> 30 dagen retourrecht</div>
                    <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-accent-600" /> Gratis verzending</div>
                  </div>
                </div>

                <div className="border-t border-stone-200 bg-stone-50 px-5 py-3 md:px-6">
                  <div className="flex items-center gap-3">
                    <img src="/ideal-wero-logo.svg" alt="iDEAL" className="h-5" />
                    <img src="/bancontact.svg" alt="Bancontact" className="h-4" />
                    <img src="/visa.svg" alt="Visa" className="h-4" />
                    <img src="/mastercard.svg" alt="Mastercard" className="h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
