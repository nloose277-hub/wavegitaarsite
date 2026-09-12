import { Helmet } from 'react-helmet-async';
import type { Product } from '../lib/types';
import { formatPrice } from '../lib/types';

export function Seo({
  title,
  description,
  image,
  url,
  type = 'website',
  structuredData,
}: {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  structuredData?: Record<string, unknown>;
}) {
  const fullTitle = title ? `${title} | WaveGitaar` : 'WaveGitaar — Gitaren Specialist';
  const desc = description ?? 'De Nederlandse specialist in elektrische gitaren. Stratocaster, Telecaster, Jazzmaster, basgitaren en versterkers. Persoonlijk advies en snelle levering.';
  const img = image ?? 'https://images.pexels.com/photos/38561551/pexels-photo-38561551.jpeg?auto=compress&cs=tinysrgb&w=1200';
  const site = 'https://wavegitaar.nl';
  const canonical = url ? `${site}${url}` : site;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {structuredData && <script type="application/ld+json">{JSON.stringify(structuredData)}</script>}
    </Helmet>
  );
}

export function productStructuredData(p: Product, reviews?: { avg: number; count: number }) {
  const offers: Record<string, unknown> = {
    '@type': 'Offer',
    price: p.price,
    priceCurrency: 'EUR',
    availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    priceSpecification: {
      '@type': 'PriceSpecification',
      price: p.price,
      priceCurrency: 'EUR',
    },
  };
  if (p.compare_price) {
    offers['priceValidUntil'] = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
    offers['eligibleTransactionVolume'] = {
      '@type': 'PriceSpecification',
      price: p.compare_price,
      priceCurrency: 'EUR',
    };
  }
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.short_description ?? p.description ?? '',
    image: p.images?.[0]?.url ?? undefined,
    sku: p.sku ?? p.slug,
    brand: { '@type': 'Brand', name: 'WaveGitaar' },
    category: p.category?.name ?? 'Gitaar',
    offers,
  };
  if (reviews && reviews.count > 0) {
    data['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: reviews.avg,
      reviewCount: reviews.count,
    };
  }
  return data;
}

export function breadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `https://wavegitaar.nl${it.url}`,
    })),
  };
}

export { formatPrice };
