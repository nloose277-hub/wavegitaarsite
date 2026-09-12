import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Scale, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, ProductImage } from '../lib/types';
import { formatPrice, getStockStatus } from '../lib/types';

type ProductWithImage = Product & { image?: string };

export default function ProductComparison({ product, currentImage }: { product: Product; currentImage?: string }) {
  const [comparables, setComparables] = useState<ProductWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('is_visible', true)
          .neq('id', product.id)
          .limit(3);
        if (product.category_id) {
          query = query.eq('category_id', product.category_id);
        }
        const { data } = await query;
        let products = (data ?? []) as Product[];

        if (products.length === 0) {
          const fallback = await supabase
            .from('products')
            .select('*, category:categories(*)')
            .eq('is_visible', true)
            .neq('id', product.id)
            .limit(3);
          products = (fallback.data ?? []) as Product[];
        }

        if (products.length === 0) {
          setComparables([]);
          return;
        }

        const imageResults = await Promise.all(
          products.map((p) =>
            supabase
              .from('product_images')
              .select('url')
              .eq('product_id', p.id)
              .order('sort_order', { ascending: true })
              .limit(1)
              .maybeSingle()
          )
        );
        const withImages: ProductWithImage[] = products.map((p, i) => ({
          ...p,
          image: (imageResults[i].data as ProductImage | null)?.url ?? undefined,
        }));
        setComparables(withImages);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [product.id, product.category_id]);

  if (loading) {
    return (
      <div className="mt-16">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-accent-600" />
          <h2 className="text-xl font-bold text-stone-900">Vergelijk met soortgelijke gitaren</h2>
        </div>
        <div className="mt-6 flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-accent-600" />
        </div>
      </div>
    );
  }

  if (comparables.length === 0) return null;

  const allCols: ProductWithImage[] = [{ ...product, image: currentImage }, ...comparables];

  const allSpecs = new Set<string>();
  allCols.forEach((p) => {
    Object.keys(p.specifications ?? {}).forEach((k) => allSpecs.add(k));
  });
  const specKeys = Array.from(allSpecs).sort();

  return (
    <div className="mt-16">
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-accent-600" />
        <h2 className="text-xl font-bold text-stone-900">Vergelijk met soortgelijke gitaren</h2>
      </div>
      <p className="mt-1 text-sm text-stone-500">
        Hieronder zie je hoe dit product zich verhoudt tot vergelijkbare modellen.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-32 border-b border-stone-200 p-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-400">
                Specificatie
              </th>
              {allCols.map((p) => {
                const isCurrent = p.id === product.id;
                return (
                  <th key={p.id} className="border-b border-stone-200 p-3 text-left align-bottom">
                    <Link
                      to={isCurrent ? '#' : `/products/${p.slug}`}
                      className={`group block ${isCurrent ? 'pointer-events-none' : 'hover:text-accent-600'}`}
                    >
                      <div className="mb-2 aspect-square w-full max-w-[120px] overflow-hidden rounded-lg border border-stone-200 bg-white">
                        {p.image || p.images?.[0]?.url ? (
                          <img
                            src={p.image ?? p.images?.[0]?.url}
                            alt={p.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-300">
                            <Scale className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <p className={`text-xs font-semibold leading-snug ${isCurrent ? 'text-stone-900' : 'text-stone-700 group-hover:text-accent-600'}`}>
                        {p.name}
                        {isCurrent && <span className="ml-1 text-[10px] font-normal text-accent-600">(huidig)</span>}
                      </p>
                      {!isCurrent && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-accent-600">
                          Bekijk <ArrowRight className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            <tr className="bg-stone-50">
              <td className="p-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Prijs</td>
              {allCols.map((p) => (
                <td key={p.id} className="p-3">
                  <span className="text-base font-bold text-stone-900">{formatPrice(p.price)}</span>
                  {p.compare_price && (
                    <span className="ml-1.5 text-xs text-stone-400 line-through">{formatPrice(p.compare_price)}</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Voorraad</td>
              {allCols.map((p) => {
                const s = getStockStatus(p.stock);
                return (
                  <td key={p.id} className="p-3">
                    <span className={`text-sm font-medium ${s.color}`}>{s.label}</span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="p-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Merk</td>
              {allCols.map((p) => (
                <td key={p.id} className="p-3 text-sm text-stone-600">{p.brand ?? '-'}</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Badge</td>
              {allCols.map((p) => (
                <td key={p.id} className="p-3 text-sm text-stone-600">{p.badge ?? '-'}</td>
              ))}
            </tr>
            {specKeys.map((key) => (
              <tr key={key} className="even:bg-stone-50/50">
                <td className="p-3 text-xs font-semibold uppercase tracking-wide text-stone-400">{key}</td>
                {allCols.map((p) => {
                  const val = p.specifications?.[key];
                  return (
                    <td key={p.id} className="p-3 text-sm text-stone-600">
                      {val ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="h-3 w-3 shrink-0 text-green-500" />
                          {val}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-stone-300">
                          <X className="h-3 w-3 shrink-0" />
                          -
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="p-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Kenmerken</td>
              {allCols.map((p) => (
                <td key={p.id} className="p-3">
                  <ul className="space-y-1">
                    {(p.features ?? []).slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-start gap-1 text-xs text-stone-600">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent-600" /> {f}
                      </li>
                    ))}
                    {(p.features ?? []).length === 0 && <li className="text-xs text-stone-300">-</li>}
                  </ul>
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3" />
              {allCols.map((p) => {
                const isCurrent = p.id === product.id;
                return (
                  <td key={p.id} className="p-3">
                    {isCurrent ? (
                      <span className="text-xs text-stone-400">Op deze pagina</span>
                    ) : (
                      <Link
                        to={`/products/${p.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-700"
                      >
                        Bekijk product <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
