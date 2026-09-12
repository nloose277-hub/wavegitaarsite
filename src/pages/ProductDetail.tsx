import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Minus, Plus, Star, Truck, Shield, RotateCcw, Check,
  ChevronRight, ChevronDown, ChevronLeft, Lock, Headphones, CreditCard,
  PackageCheck, X, ZoomIn, Sparkles,
} from 'lucide-react';
import { Seo, productStructuredData, breadcrumbStructuredData } from '../components/Seo';
import ProductComparison from '../components/ProductComparison';
import { ProductCard } from '../components/ProductCard';
import { fetchProductBySlug, fetchProductImages, fetchReviews, createReview, fetchProducts, fetchReviewSummaries } from '../lib/api';
import type { Product, ProductImage, Review, ColorOption } from '../lib/types';
import type { ReviewSummary } from '../lib/api';
import { formatPrice, getStockStatus } from '../lib/types';
import { useCart } from '../lib/cart';
import { supabase } from '../lib/supabase';

const AVATAR_COLORS = ['#d97706', '#0369a1', '#15803d', '#b91c1c', '#7c3aed', '#c2410c', '#0f766e', '#be185d'];

const FAQ_ITEMS = [
  { q: 'Wanneer wordt mijn bestelling geleverd?', a: 'Bestel je op een werkdag vóór 21:59? Dan hebben we je bestelling de volgende dag in huis. Bestellingen die in het weekend worden geplaatst, worden binnen 1-3 werkdagen geleverd.' },
  { q: 'Hoeveel garantie krijg ik?', a: 'Op alle gitaren en versterkers van WaveGitaar krijg je 3 jaar garantie. Bij een defect binnen de garantieperiode zorgen wij voor reparatie of vervanging.' },
  { q: 'Kan ik de gitaar retourneren?', a: 'Ja. Je hebt 30 dagen bedenktijd vanaf het moment dat je je bestelling ontvangt. Neem contact met ons op via info@wavegitaar.nl en wij sturen je de retourinstructies.' },
  { q: 'Is deze gitaar op voorraad?', a: 'De voorraadstatus staat op de productpagina vermeld. Als het product op voorraad is, wordt het direct verzonden na je bestelling.' },
  { q: 'Hoe kan ik betalen?', a: 'Je kunt veilig betalen met iDEAL of Bancontact. Alle betalingen worden verwerkt via een beveiligde SSL-verbinding.' },
  { q: 'Kan ik contact opnemen voor advies?', a: 'Natuurlijk! Twijfel je of deze gitaar bij je past? Neem contact met ons op via WhatsApp of e-mail (info@wavegitaar.nl). We helpen je graag persoonlijk kiezen.' },
];

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function avatarColor(name: string): string {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function FAQItem({ item, defaultOpen }: { item: typeof FAQ_ITEMS[0]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b border-stone-200 last:border-b-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left">
        <span className="text-sm font-semibold text-stone-900">{item.q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-stone-500 leading-relaxed">{item.a}</p>}
    </div>
  );
}

function Lightbox({ images, index, onClose, onNavigate }: {
  images: ProductImage[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && index < images.length - 1) onNavigate(index + 1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, images.length, onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button className="absolute right-4 top-4 text-white/70 hover:text-white" onClick={onClose}><X className="h-8 w-8" /></button>
      {index > 0 && (
        <button className="absolute left-4 text-white/70 hover:text-white" onClick={(e) => { e.stopPropagation(); onNavigate(index - 1); }}><ChevronLeft className="h-10 w-10" /></button>
      )}
      {index < images.length - 1 && (
        <button className="absolute right-4 text-white/70 hover:text-white" onClick={(e) => { e.stopPropagation(); onNavigate(index + 1); }}><ChevronRight className="h-10 w-10" /></button>
      )}
      <img src={images[index]?.url} alt={images[index]?.alt ?? ''} className="max-h-[85vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

type Tab = 'description' | 'specs' | 'reviews' | 'faq';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Array<Product & { image?: string }>>([]);
  const [reviewSummaries, setReviewSummaries] = useState<Record<string, ReviewSummary>>({});
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ author_name: '', rating: 5, title: '', body: '' });
  const [reviewError, setReviewError] = useState('');
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('description');

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (!slug) return;
      try {
        const p = await fetchProductBySlug(slug);
        setProduct(p);
        if (p) {
          const [imgs2, revs2, rsums] = await Promise.all([
            fetchProductImages(p.id), fetchReviews(p.id), fetchReviewSummaries(),
          ]);
          setImages(imgs2);
          setReviews(revs2);
          setReviewSummaries(rsums);
          setSelectedColor(p.color_options?.[0] ?? null);

          const allProducts = await fetchProducts({});
          let related = allProducts
            .filter((rp) => rp.id !== p.id && rp.is_visible !== false)
            .sort((a, b) => {
              const aSameCat = a.category_id === p.category_id ? 0 : 1;
              const bSameCat = b.category_id === p.category_id ? 0 : 1;
              return aSameCat - bSameCat;
            })
            .slice(0, 4);

          if (related.length < 4) {
            const more = allProducts
              .filter((rp) => rp.id !== p.id && rp.is_visible !== false && !related.find((r) => r.id === rp.id))
              .slice(0, 4 - related.length);
            related = [...related, ...more];
          }

          const withImages = await Promise.all(
            related.map(async (rp) => {
              const { data: imgData } = await supabase
                .from('product_images').select('url')
                .eq('product_id', rp.id).order('sort_order', { ascending: true }).limit(1).maybeSingle();
              return { ...rp, image: (imgData as ProductImage | null)?.url ?? undefined };
            })
          );
          setRelatedProducts(withImages);
        }
      } catch { /* fail silently */ } finally { setLoading(false); }
    })();
  }, [slug]);

  useEffect(() => {
    const onScroll = () => {
      const buySection = document.getElementById('buy-section');
      if (!buySection) return;
      const rect = buySection.getBoundingClientRect();
      setStickyVisible(rect.bottom < 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setActiveImg(0); setQty(1); setAdded(false); setShowReviewForm(false); setActiveTab('description');
  }, [slug]);
  const navigateLightbox = useCallback((i: number) => setActiveImg(i), []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-content flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-2xl font-bold text-stone-900">Product niet gevonden</h1>
        <Link to="/products" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-600 px-6 py-3 text-sm font-bold text-white hover:bg-accent-700">Bekijk alle gitaren</Link>
      </div>
    );
  }

  const colors = product.color_options ?? [];
  const hasColors = colors.length > 0;
  const colorAdjust = selectedColor?.price_adjustment ?? 0;
  const adjustedPrice = product.price + colorAdjust;
  const hasDiscount = product.compare_price && product.compare_price > adjustedPrice;
  const discountAmount = hasDiscount ? product.compare_price! - adjustedPrice : 0;
  const discountPercent = hasDiscount ? Math.round((discountAmount / product.compare_price!) * 100) : 0;
  const variantStock = (() => {
    let s = product.stock;
    if (selectedColor?.stock != null) s = Math.min(s, selectedColor.stock);
    return s;
  })();
  const stock = getStockStatus(variantStock);
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const specs = product.specifications ?? {};
  const features = product.features ?? [];
  const inStock = variantStock > 0;
  const lowStock = inStock && variantStock <= 3;

  const handleAdd = () => {
    const variantParts: string[] = [];
    if (selectedColor) variantParts.push(selectedColor.name);
    const variantLabel = variantParts.length > 0 ? variantParts.join(' · ') : undefined;
    const variantKeyParts: string[] = [];
    if (selectedColor) variantKeyParts.push(`color:${selectedColor.name}`);
    const variantKey = variantKeyParts.length > 0 ? variantKeyParts.join('|') : undefined;
    add({ ...product, price: adjustedPrice }, images[0]?.url ?? null, qty, variantLabel, variantKey);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewData.author_name.trim()) { setReviewError('Vul je naam in.'); return; }
    try {
      await createReview({ product_id: product.id, author_name: reviewData.author_name, rating: reviewData.rating, title: reviewData.title, body: reviewData.body });
      setShowReviewForm(false);
      setReviewData({ author_name: '', rating: 5, title: '', body: '' });
      setReviewError('');
      setReviews([...reviews, { id: 'pending', product_id: product.id, author_name: reviewData.author_name, rating: reviewData.rating, title: reviewData.title || null, body: reviewData.body || null, is_approved: false, is_example: false, source: 'user', avatar_url: null, created_at: new Date().toISOString() }]);
    } catch { setReviewError('Er ging iets mis. Probeer het opnieuw.'); }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'description', label: 'Omschrijving' },
    { id: 'specs', label: 'Specificaties' },
    { id: 'reviews', label: 'Reviews', count: reviews.length },
    { id: 'faq', label: 'Veelgestelde vragen' },
  ];

  return (
    <>
      <Seo title={product.name} description={product.short_description ?? undefined} url={`/products/${product.slug}`} type="product" image={images[0]?.url} structuredData={productStructuredData(product, { avg: avgRating, count: reviews.length })} />
      <script type="application/ld+json">{JSON.stringify(breadcrumbStructuredData([
        { name: 'Home', url: '/' }, { name: 'Gitaren', url: '/products' }, { name: product.name, url: `/products/${product.slug}` },
      ]))}</script>

      {/* Breadcrumb */}
      <div className="border-b border-stone-200 bg-white">
        <div className="container-content flex items-center gap-1.5 py-3 text-xs text-stone-500 overflow-x-auto scrollbar-hide">
          <Link to="/" className="hover:text-stone-900 shrink-0">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-stone-900 shrink-0">Gitaren</Link>
          {product.category && (<><span>/</span><Link to={`/products?category=${product.category.slug}`} className="hover:text-stone-900 shrink-0">{product.category.name}</Link></>)}
          <span>/</span>
          <span className="text-stone-900 shrink-0 font-medium">{product.name}</span>
        </div>
      </div>

      {/* === MAIN PRODUCT SECTION — white === */}
      <div className="bg-white">
        <div className="container-content py-6 md:py-10">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            {/* IMAGE GALLERY */}
            <div className="md:sticky md:top-24 md:self-start">
              <div className="group relative overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                {images[activeImg] ? (
                  <>
                    <img src={images[activeImg].url} alt={images[activeImg].alt ?? product.name} className="aspect-square w-full object-contain" />
                    <button onClick={() => setLightboxOpen(true)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-stone-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white shadow-sm" aria-label="Vergroten">
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center text-stone-300"><ShoppingBag className="h-20 w-20" /></div>
                )}
                {hasDiscount && (
                  <div className="absolute left-0 top-0 rounded-br-lg bg-red-500 px-3 py-1.5 text-sm font-bold text-white">-{discountPercent}%</div>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {images.map((img, i) => (
                    <button key={img.id} onClick={() => setActiveImg(i)} className={`h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-stone-50 transition-all ${i === activeImg ? 'border-accent-500' : 'border-stone-200 hover:border-stone-400'}`}>
                      <img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PURCHASE PANEL — white */}
            <div id="buy-section">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold uppercase tracking-wide text-accent-600">{product.brand}</span>
                {product.badge && <span className="rounded bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-600">{product.badge}</span>}
              </div>

              <h1 className="text-xl font-bold leading-tight text-stone-900 md:text-2xl">{product.name}</h1>

              <div className="mt-2.5 flex items-center gap-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                  ))}
                </div>
                <span className="text-sm text-stone-500">
                  {reviews.length > 0 ? `${avgRating.toFixed(1)} · ${reviews.length} review${reviews.length !== 1 ? 's' : ''}` : 'Nog geen reviews'}
                </span>
              </div>

              {/* Price */}
              <div className="mt-5">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl font-bold text-stone-900">{formatPrice(adjustedPrice)}</span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-stone-400 line-through">{formatPrice(product.compare_price!)}</span>
                      <span className="rounded-lg bg-green-50 px-3 py-1 text-sm font-bold text-green-700">Bespaar {formatPrice(discountAmount)}</span>
                    </>
                  )}
                </div>
                {colorAdjust !== 0 && <p className="mt-1.5 text-xs text-stone-400">inclusief variant</p>}
              </div>

              {/* Stock + delivery card */}
              <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-3 w-3 items-center justify-center rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`}>
                    {inStock && <Check className="h-2 w-2 text-white" strokeWidth={3} />}
                  </span>
                  <p className={`text-sm font-bold ${inStock ? 'text-green-700' : 'text-red-600'}`}>{stock.label}</p>
                  {lowStock && <span className="text-xs font-bold text-orange-600">— Bestel snel!</span>}
                </div>
                <div className="mt-3 space-y-1.5 border-t border-stone-200 pt-3">
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <Truck className="h-4 w-4 text-accent-600" />
                    <span><strong className="text-stone-900">Vóór 21:59 besteld = morgen in huis</strong></span>
                  </div>
                  <p className="pl-6 text-xs text-stone-400">Weekend: binnen 1-3 werkdagen geleverd.</p>
                </div>
              </div>

              {/* Short description */}
              {product.short_description && (
                <p className="mt-4 text-sm leading-relaxed text-stone-500">{product.short_description}</p>
              )}

              {/* Color picker */}
              {hasColors && (
                <div className="mt-5">
                  <label className="mb-2.5 block text-sm font-bold text-stone-900">
                    Kleur {selectedColor && <span className="font-normal text-stone-500">— {selectedColor.name}</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c, i) => {
                      const isSelected = selectedColor?.name === c.name;
                      return (
                        <button key={i} type="button" onClick={() => setSelectedColor(isSelected ? null : c)}
                          className={`flex items-center gap-2 rounded-lg border-2 px-3.5 py-2 text-sm transition-all ${
                            isSelected ? 'border-accent-500 bg-accent-50 text-stone-900' : 'border-stone-200 text-stone-600 hover:border-stone-400'
                          }`}>
                          <span className="h-4 w-4 rounded-full border border-stone-300" style={{ backgroundColor: c.hex }} />
                          {c.name}
                          {c.price_adjustment != null && c.price_adjustment !== 0 && (
                            <span className="text-xs text-stone-400">{c.price_adjustment > 0 ? '+' : ''}{formatPrice(c.price_adjustment)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity + Add to cart */}
              <div className="mt-6 flex items-stretch gap-3">
                <div className="flex items-center rounded-lg border border-stone-300 bg-white">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3.5 py-3 text-stone-500 hover:text-stone-900 disabled:opacity-30" disabled={variantStock === 0}><Minus className="h-4 w-4" /></button>
                  <span className="w-10 text-center text-base font-bold text-stone-900">{qty}</span>
                  <button onClick={() => setQty(Math.min(variantStock, qty + 1))} className="px-3.5 py-3 text-stone-500 hover:text-stone-900 disabled:opacity-30" disabled={variantStock === 0}><Plus className="h-4 w-4" /></button>
                </div>
                <button onClick={handleAdd} disabled={variantStock === 0}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-all disabled:opacity-40 ${
                    added ? 'bg-green-600 text-white' : 'bg-accent-600 text-white hover:bg-accent-700'
                  }`}>
                  {added ? <><Check className="h-4 w-4" /> Toegevoegd!</> : <><ShoppingBag className="h-4 w-4" /> In winkelwagen</>}
                </button>
              </div>
              <button onClick={() => { handleAdd(); navigate('/checkout/gate'); }} disabled={variantStock === 0}
                className="mt-2.5 w-full rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-bold text-stone-900 transition-colors hover:border-accent-600 hover:bg-accent-50 disabled:opacity-40">
                Direct afrekenen
              </button>

              {/* Trust badges */}
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  { icon: Shield, label: '3 jaar garantie' },
                  { icon: Lock, label: 'Veilig betalen' },
                  { icon: Truck, label: 'Morgen in huis' },
                  { icon: RotateCcw, label: '30 dagen retour' },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 rounded-lg border border-stone-200 bg-white p-3 text-center">
                    <s.icon className="h-5 w-5 text-accent-600" />
                    <span className="text-xs font-medium text-stone-600">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Payment */}
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                <CreditCard className="h-5 w-5 shrink-0 text-stone-400" />
                <div className="flex items-center gap-3">
                  <img src="/ideal-wero-logo.svg" alt="iDEAL" className="h-5" />
                  <img src="/bancontact.svg" alt="Bancontact" className="h-4" />
                </div>
                <span className="text-xs text-stone-400">Veilig afrekenen</span>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-lg border border-accent-100 bg-accent-50 px-4 py-3">
                <Headphones className="h-5 w-5 shrink-0 text-accent-600" />
                <p className="text-sm text-stone-600">
                  Twijfel je?{' '}
                  <Link to="/contact" className="font-bold text-accent-600 hover:text-accent-700">Neem contact op via WhatsApp</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === TABBED CONTENT === */}
      <div className="border-t border-stone-200 bg-stone-50">
        <div className="container-content py-8 md:py-10">
          <div className="flex items-center gap-1 border-b border-stone-200 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 border-b-2 px-5 py-3.5 text-sm font-bold transition-colors ${
                  activeTab === tab.id ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}>
                {tab.label}
                {tab.count != null && tab.count > 0 && <span className="ml-1.5 text-xs">({tab.count})</span>}
              </button>
            ))}
          </div>

          <div className="py-8">
            {/* DESCRIPTION */}
            {activeTab === 'description' && (
              <div className="grid gap-8 lg:grid-cols-3 max-w-5xl">
                {features.length > 0 && (
                  <div className="lg:col-span-1">
                    <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-stone-900">
                      <Sparkles className="h-4 w-4 text-accent-600" /> Kenmerken
                    </h2>
                    <ul className="space-y-2.5">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {product.description && (
                  <div className={features.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
                    <h2 className="mb-3 text-base font-bold text-stone-900">Over dit product</h2>
                    <p className="text-sm leading-relaxed text-stone-600 whitespace-pre-line">{product.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* SPECS */}
            {activeTab === 'specs' && Object.keys(specs).length > 0 && (
              <div className="max-w-3xl">
                <div className="overflow-hidden rounded-lg border border-stone-200">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-stone-200">
                      {Object.entries(specs).map(([key, val], i) => (
                        <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                          <td className="py-3.5 px-5 font-bold text-stone-900 w-2/5">{key}</td>
                          <td className="py-3.5 px-5 text-stone-600">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="max-w-3xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-stone-900">{avgRating.toFixed(1)}</p>
                      <div className="mt-1 flex justify-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-stone-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={() => setShowReviewForm(!showReviewForm)} className="rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-700">Schrijf een review</button>
                  </div>
                </div>

                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="mb-6 rounded-lg border border-stone-200 bg-white p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="input-label">Je naam *</label>
                        <input type="text" value={reviewData.author_name} onChange={(e) => setReviewData({ ...reviewData, author_name: e.target.value })} className="input-field" required />
                      </div>
                      <div>
                        <label className="input-label">Beoordeling</label>
                        <div className="flex gap-1 pt-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} type="button" onClick={() => setReviewData({ ...reviewData, rating: s })}>
                              <Star className={`h-7 w-7 ${s <= reviewData.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="input-label">Titel</label>
                      <input type="text" value={reviewData.title} onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })} className="input-field" />
                    </div>
                    <div className="mt-4">
                      <label className="input-label">Review</label>
                      <textarea value={reviewData.body} onChange={(e) => setReviewData({ ...reviewData, body: e.target.value })} className="input-field min-h-28" rows={4} />
                    </div>
                    {reviewError && <p className="mt-2 text-sm text-red-600">{reviewError}</p>}
                    <p className="mt-2 text-xs text-stone-400">Je review wordt geplaatst na goedkeuring.</p>
                    <button type="submit" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-700">Verstuur review</button>
                  </form>
                )}

                {reviews.length === 0 ? (
                  <p className="text-stone-500">Nog geen reviews. Wees de eerste!</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div key={r.id} className="rounded-lg border border-stone-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {r.avatar_url ? (
                              <img src={r.avatar_url} alt={r.author_name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: avatarColor(r.author_name) }}>{initials(r.author_name)}</div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-stone-900">{r.author_name}</p>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`h-4 w-4 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          {r.is_example && <span className="text-xs text-stone-400">Voorbeeld</span>}
                        </div>
                        {r.title && <h3 className="mt-3 text-sm font-bold text-stone-900">{r.title}</h3>}
                        {r.body && <p className="mt-1 text-sm text-stone-600 leading-relaxed">{r.body}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FAQ */}
            {activeTab === 'faq' && (
              <div className="max-w-3xl">
                {FAQ_ITEMS.map((item, i) => (
                  <FAQItem key={i} item={item} defaultOpen={i === 0} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === GUARANTEE CARDS === */}
      <div className="bg-white py-10 md:py-12">
        <div className="container-content">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: '3 jaar garantie', desc: 'Op alle gitaren en versterkers. Bij een defect zorgen wij voor reparatie of vervanging.' },
              { icon: RotateCcw, title: '30 dagen retour', desc: 'Niet tevreden? Je hebt 30 dagen bedenktijd. Neem contact op en wij regelen de retour.' },
              { icon: Truck, title: 'Snelle levering', desc: 'Vóór 21:59 besteld op werkdagen = morgen in huis. Gratis verzending op alle bestellingen.' },
              { icon: PackageCheck, title: 'Veilig verpakt', desc: 'Elke gitaar wordt zorgvuldig verpakt in een stevige gitaardoos met voldoende bescherming.' },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border border-stone-200 bg-white p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-stone-900">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-stone-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === PRODUCT COMPARISON === */}
      <ProductComparison product={product} currentImage={images[0]?.url ?? undefined} />

      {/* === RELATED PRODUCTS === */}
      {relatedProducts.length > 0 && (
        <div className="bg-stone-50 py-10 md:py-12">
          <div className="container-content">
            <h2 className="section-title mb-6">Klanten kochten ook</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp} image={rp.image} reviewSummary={reviewSummaries[rp.id] ? { count: reviewSummaries[rp.id].count, avg: reviewSummaries[rp.id].avg } : undefined} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === STICKY MOBILE BAR === */}
      {stickyVisible && inStock && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white shadow-lg md:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="shrink-0">
              <p className="text-base font-bold text-stone-900">{formatPrice(adjustedPrice)}</p>
              {hasDiscount && <p className="text-xs text-stone-400 line-through">{formatPrice(product.compare_price!)}</p>}
            </div>
            <button onClick={handleAdd} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition-colors ${added ? 'bg-green-600 text-white' : 'bg-accent-600 text-white hover:bg-accent-700'}`}>
              {added ? <><Check className="h-4 w-4" /> Toegevoegd!</> : <><ShoppingBag className="h-4 w-4" /> In winkelwagen</>}
            </button>
          </div>
        </div>
      )}

      {lightboxOpen && images.length > 0 && (
        <Lightbox images={images} index={activeImg} onClose={() => setLightboxOpen(false)} onNavigate={navigateLightbox} />
      )}
    </>
  );
}
