import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronRight, Check } from 'lucide-react';
import { Seo } from '../components/Seo';
import { ProductCard } from '../components/ProductCard';
import { applyProductImages } from '../lib/productImages';
import { fetchProducts, fetchCategories, fetchProductImages, fetchReviewSummaries } from '../lib/api';
import { getLocalProductImages } from '../lib/productImages';
import type { Product, Category } from '../lib/types';
import type { ReviewSummary } from '../lib/api';

async function loadImagesSafely(products: Product[]): Promise<Product[]> {
  return products.map((product) => applyProductImages(product));
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviewSummaries, setReviewSummaries] = useState<Record<string, ReviewSummary>>({});
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const activeCategory = searchParams.get('category') ?? '';
  const sortBy = searchParams.get('sort') ?? 'default';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [cats, prods, rsums] = await Promise.all([
          fetchCategories(),
          fetchProducts({}),
          fetchReviewSummaries(),
        ]);

        const productsWithImages = await loadImagesSafely(prods);

        if (cancelled) return;
        setCategories(cats);
        setReviewSummaries(rsums);
        setProducts(productsWithImages);
      } catch {
        if (!cancelled) {
          setCategories([]);
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];

    if (activeCategory) {
      const cat = categories.find((c) => c.slug === activeCategory);
      if (cat) list = list.filter((p) => p.category_id === cat.id);
    }

    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, categories, activeCategory, sortBy]);

  const activeCatName =
    categories.find((c) => c.slug === activeCategory)?.name ?? 'Alle gitaren';
  const activeCatDesc =
    categories.find((c) => c.slug === activeCategory)?.description ?? null;

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const SidebarContent = () => (
    <>
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-400">
          Categorieën
        </h3>
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => {
                setParam('category', '');
                setShowMobileFilters(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                !activeCategory
                  ? 'bg-accent-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Alle gitaren
              {!activeCategory && <Check className="h-4 w-4" />}
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => {
                  setParam('category', c.slug);
                  setShowMobileFilters(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeCategory === c.slug
                    ? 'bg-accent-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {c.name}
                {activeCategory === c.slug && <Check className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h3 className="text-sm font-bold text-stone-900">Twijfel je?</h3>
        <p className="mt-1 text-xs text-stone-500">
          We helpen je persoonlijk kiezen via WhatsApp of e-mail.
        </p>
        <Link
          to="/contact"
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-accent-600 hover:text-accent-700"
        >
          Contact <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </>
  );

  return (
    <>
      <Seo
        title={activeCatName}
        description="Bekijk ons volledige assortiment gitaren — Stratocaster, Telecaster, Jazzmaster, basgitaren en versterkers."
        url="/products"
      />

      <div className="border-b border-stone-200 bg-white">
        <div className="container-content py-3">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Link to="/" className="hover:text-stone-900">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-stone-900">{activeCatName}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-stone-200 bg-white">
        <div className="container-content py-6 md:py-8">
          <h1 className="text-xl font-bold text-stone-900 md:text-2xl">{activeCatName}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {activeCatDesc ??
              'Vóór 21:59 besteld = morgen in huis. Gratis verzending en 3 jaar garantie.'}
          </p>
        </div>
      </div>

      <div className="sticky top-14 z-30 border-b border-stone-200 bg-white/95 backdrop-blur md:top-[88px]">
        <div className="container-content">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
            <button
              onClick={() => setParam('category', '')}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                !activeCategory
                  ? 'bg-accent-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Alle
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setParam('category', c.slug)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  activeCategory === c.slug
                    ? 'bg-accent-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-stone-50">
        <div className="container-content py-6 md:py-8">
          <div className="flex gap-8">
            <aside className="hidden w-56 shrink-0 md:block">
              <div className="sticky top-36 rounded-lg border border-stone-200 bg-white p-5">
                <SidebarContent />
              </div>
            </aside>

            <div className="flex-1">
              <div className="mb-5 flex items-center justify-between gap-4">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 md:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setParam('sort', e.target.value)}
                  className="ml-auto rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 focus:border-stone-900 focus:outline-none"
                >
                  <option value="default">Sorteren: Standaard</option>
                  <option value="price-asc">Prijs: Laag naar hoog</option>
                  <option value="price-desc">Prijs: Hoog naar laag</option>
                  <option value="name">Naam: A-Z</option>
                </select>
              </div>

              {loading ? (
                <div className="flex h-60 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex h-60 flex-col items-center justify-center text-center">
                  <p className="text-sm font-medium text-stone-500">
                    Geen producten gevonden in deze categorie.
                  </p>
                  <Link
                    to="/products"
                    className="mt-3 text-sm font-bold text-accent-600 hover:text-accent-700"
                  >
                    Bekijk alle gitaren
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                  {filtered.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      image={p.images?.[0]?.url}
                      reviewSummary={reviewSummaries[p.id]}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showMobileFilters && (
        <div
          className="fixed inset-0 z-50 bg-black/30"
          onClick={() => setShowMobileFilters(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
