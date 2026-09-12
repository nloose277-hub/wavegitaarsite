import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Shield, RotateCcw, Lock, ArrowRight, Check, Star,
  ChevronRight, Headphones, Sparkles,
} from 'lucide-react';
import { Seo } from '../components/Seo';
import { Reveal } from '../components/Reveal';
import { ProductCard } from '../components/ProductCard';
import { fetchProducts, fetchSiteContent, fetchReviewSummaries, fetchProductImages, fetchCategories } from '../lib/api';
import type { Product, SiteContent, Category } from '../lib/types';
import type { ReviewSummary } from '../lib/api';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [onSale, setOnSale] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [content, setContent] = useState<Record<string, SiteContent>>({});
  const [reviewSummaries, setReviewSummaries] = useState<Record<string, ReviewSummary>>({});
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [allP, c, rsums, cats] = await Promise.all([
          fetchProducts({ limit: 50 }), fetchSiteContent(), fetchReviewSummaries(), fetchCategories(),
        ]);
        setContent(c);
        setReviewSummaries(rsums);
        setCategories(cats);

        const featured = allP.filter((p) => p.is_featured);
        const sale = allP.filter((p) => p.compare_price && p.compare_price > p.price);
        const sorted = [...allP].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));

        const needsImages = [...featured.slice(0, 8), ...sale.slice(0, 4), ...sorted.slice(0, 4)];
        const uniqueIds = new Set<string>();
        const toFetch = needsImages.filter((p) => {
          if (uniqueIds.has(p.id)) return false;
          uniqueIds.add(p.id);
          return true;
        });

        const withImages = await Promise.all(
          toFetch.map(async (prod) => {
            const imgs = await fetchProductImages(prod.id);
            return { ...prod, images: imgs };
          })
        );

        const byId = new Map(withImages.map((p) => [p.id, p]));
        setProducts(featured.slice(0, 8).map((p) => byId.get(p.id) ?? p));
        setOnSale(sale.slice(0, 4).map((p) => byId.get(p.id) ?? p));
        setNewArrivals(sorted.slice(0, 4).map((p) => byId.get(p.id) ?? p));
      } catch { /* fail silently */ }
    })();
  }, []);

  const about = content['home_about'];

  return (
    <>
      <Seo title="" description="WaveGitaar — de Nederlandse specialist in elektrische gitaren. Stratocaster, Telecaster, basgitaren en versterkers." url="/" />

      {/* === COMPACT INTRO — no hero image === */}
      <section className="border-b border-stone-200 bg-white">
        <div className="container-content py-10 text-center md:py-14">
          <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">WaveGitaar</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-500 md:text-base">
            Professionele gitaren voor muzikanten. Stratocaster, Telecaster, basgitaren en versterkers — kwaliteit, eerlijk advies, morgen in huis.
          </p>
          <div className="mt-5 flex justify-center">
            <Link to="/products" className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-700">
              Bekijk gitaren <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* === TRUST BAR === */}
      <section className="border-b border-stone-200 bg-stone-50">
        <div className="container-content grid grid-cols-2 gap-4 py-4 md:grid-cols-4">
          {[
            { icon: Shield, label: '3 jaar garantie', sub: 'Op alle gitaren' },
            { icon: Truck, label: 'Morgen in huis', sub: 'Vóór 21:59 besteld' },
            { icon: Lock, label: 'Veilig betalen', sub: 'iDEAL & Bancontact' },
            { icon: RotateCcw, label: '30 dagen retour', sub: 'Geld terug garantie' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <b.icon className="h-5 w-5 shrink-0 text-accent-600" />
              <div>
                <p className="text-xs font-semibold text-stone-900">{b.label}</p>
                <p className="text-xs text-stone-400 hidden sm:block">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === CATEGORIES === */}
      <section className="py-10 md:py-14">
        <div className="container-content">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="section-title">Categorieën</h2>
            <Link to="/products" className="hidden items-center gap-1 text-sm font-semibold text-accent-600 hover:text-accent-700 sm:flex">
              Bekijk alle <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {categories.length > 0 ? categories.map((cat, i) => (
              <Reveal key={cat.id} delay={i * 60}>
                <Link
                  to={`/products?category=${cat.slug}`}
                  className="group flex flex-col justify-end overflow-hidden rounded-lg border border-stone-200 bg-white p-5 transition-all hover:border-stone-300 hover:shadow-md aspect-[4/3]"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-accent-600 transition-colors group-hover:bg-accent-50">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">{cat.name}</h3>
                  <p className="mt-0.5 text-xs text-stone-400">{cat.description ?? 'Bekijk collectie'}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent-600">
                    Bekijk <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </Reveal>
            )) : (
              <div className="col-span-4 py-8 text-center text-sm text-stone-400">Categorieën laden...</div>
            )}
          </div>
        </div>
      </section>

      {/* === FEATURED PRODUCTS === */}
      <section className="bg-stone-50 py-10 md:py-14">
        <div className="container-content">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="section-title">Populaire gitaren</h2>
            <Link to="/products" className="hidden items-center gap-1 text-sm font-semibold text-accent-600 hover:text-accent-700 sm:flex">
              Bekijk alle <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} image={p.images?.[0]?.url} reviewSummary={reviewSummaries[p.id]} />
            ))}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <Link to="/products" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-600">
              Bekijk alle gitaren <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* === ON SALE === */}
      {onSale.length > 0 && (
        <section className="py-10 md:py-14">
          <div className="container-content">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <span className="mb-1.5 inline-block rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">Aanbiedingen</span>
                <h2 className="section-title">Tijdelijke aanbiedingen</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {onSale.map((p) => (
                <ProductCard key={p.id} product={p} image={p.images?.[0]?.url} reviewSummary={reviewSummaries[p.id]} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === NEW ARRIVALS === */}
      {newArrivals.length > 0 && (
        <section className="bg-stone-50 py-10 md:py-14">
          <div className="container-content">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="section-title">Nieuw binnen</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} image={p.images?.[0]?.url} reviewSummary={reviewSummaries[p.id]} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === WHY WAVEGITAAR === */}
      <section className="py-10 md:py-14">
        <div className="container-content">
          <h2 className="section-title mb-6">Waarom WaveGitaar</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: '3 jaar garantie', desc: 'Op alle gitaren en versterkers.' },
              { icon: Truck, title: 'Snelle levering', desc: 'Vóór 21:59 besteld = morgen in huis.' },
              { icon: Lock, title: 'Veilig betalen', desc: 'iDEAL, Bancontact en meer.' },
              { icon: Headphones, title: 'Persoonlijk advies', desc: 'Hulp via WhatsApp, e-mail of telefoon.' },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{f.title}</h3>
                    <p className="mt-0.5 text-xs text-stone-500">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === REVIEWS === */}
      <section className="bg-stone-50 py-10 md:py-14">
        <div className="container-content">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="section-title">Wat klanten zeggen</h2>
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-stone-500">4.9/5</span>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Mark de Vries', text: 'Geweldige service! Mijn Stratocaster was binnen 2 werkdagen in huis. Felix hielp me persoonlijk kiezen.', date: '3 maanden geleden', photo: '/review-mark.webp' },
              { name: 'Sophie Jansen', text: 'Eindelijk een winkel die écht verstand van gitaren heeft. Passie voor het vak, dat voel je.', date: '5 maanden geleden', photo: '/review-sophie.webp' },
              { name: 'Daan Bakker', text: 'Beste gitaarzaak van Nederland. Mijn Telecaster klonk fantastisch uit de doos. Aanrader!', date: '4 maanden geleden', photo: '/review-daan.webp' },
              { name: 'Lucas Vermeulen', text: 'Besteld en de volgende dag lag mijn Jazzmaster op de mat. Wat een service!', date: '2 maanden geleden', photo: '/review-lucas.webp' },
              { name: 'Amira El Idrissi', text: 'Via WhatsApp supergoed advies gekregen, geen druk, alleen eerlijk. Geweldige ervaring.', date: '3 weken geleden', photo: '/review-amira.webp' },
              { name: 'Thomas Müller', text: 'Ordered from Germany, received my bass within 3 days. Excellent packaging and communication!', date: '2 maanden geleden', photo: '/review-thomas.webp' },
            ].map((r, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="flex h-full flex-col rounded-lg border border-stone-200 bg-white p-5">
                  <div className="mb-3 flex items-center gap-3">
                    {r.photo ? (
                      <img src={r.photo} alt={r.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-sm font-bold text-stone-600">
                        {r.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-stone-900">{r.name}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-xs text-stone-400">{r.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-stone-600">{r.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === ABOUT TEASER === */}
      <section className="py-10 md:py-14">
        <div className="container-content grid gap-8 md:grid-cols-2 md:items-center">
          <Reveal>
            <div className="overflow-hidden rounded-lg border border-stone-200">
              <img src="https://images.pexels.com/photos/15752209/pexels-photo-15752209.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Gitaar detail" className="h-full w-full object-cover" />
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div>
              <h2 className="section-title">{about?.title ?? 'Over WaveGitaar'}</h2>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                {about?.body ?? 'WaveGitaar is de Nederlandse specialist in elektrische gitaren. Liefde voor het instrument, kwaliteit staat centraal. Bij ons koop je een echte gitaar, geen gamble.'}
              </p>
              <ul className="mt-4 space-y-2">
                {['KvK 32137384', '3 jaar garantie op alle gitaren', 'Persoonlijk contact via WhatsApp', '30 dagen retourrecht'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-stone-600">
                    <Check className="h-4 w-4 shrink-0 text-accent-600" /> {item}
                  </li>
                ))}
              </ul>
              <Link to="/over-ons" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-accent-600 hover:text-accent-700">
                Lees meer <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
