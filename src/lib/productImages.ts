import type { Product } from './types';

export type ProductImageSource = {
  id: string;
  product_id: string;
  url: string;
  alt: string;
  sort_order: number;
};

type ImageSet = {
  match: string[];
  files?: string[];
  urls?: string[];
};

// One source of truth for EVERY storefront/product-page image.
// Exact model matching prevents Player and Player II images from being mixed.
const IMAGE_SETS: ImageSet[] = [
  { match: ['player stratocaster', 'black'], files: [
    '01-player-stratocaster-black/1.jpg',
    '01-player-stratocaster-black/2.jpg',
    '01-player-stratocaster-black/3.jpg',
  ]},
  { match: ['player stratocaster', 'olympic pearl'], files: [] },
  { match: ['american professional ii stratocaster'], files: [
    '03-american-professional-ii-stratocaster/1.jpg',
    '03-american-professional-ii-stratocaster/2.jpg',
    '03-american-professional-ii-stratocaster/3.jpg',
  ]},
  { match: ['player ii telecaster', 'butterscotch blonde'], urls: [
    'https://nl.fender.com/cdn/shop/files/0140552550_fen_ins_frt_1_rr.png?v=1728470194&width=1445',
  ]},
  { match: ['player telecaster', 'butterscotch blonde'], files: [
    '04-player-telecaster-butterscotch-blonde/1.jpg',
    '04-player-telecaster-butterscotch-blonde/2.jpg',
  ]},
  { match: ['american professional ii telecaster'], urls: [
    'https://nl.fender.com/cdn/shop/files/0113942750_fen_ins_frt_1_rr.png?v=1742168903&width=1445',
  ]},
  { match: ['player jazzmaster', 'polar white'], files: [
    '06-player-jazzmaster-polar-white/1.jpg',
    '06-player-jazzmaster-polar-white/2.jpg',
  ]},
  { match: ['player precision bass', 'black'], files: [
    '07-player-precision-bass-black/1.jpg',
    '07-player-precision-bass-black/2.jpg',
    '07-player-precision-bass-black/3.jpg',
  ]},
  { match: ['player jazz bass', 'polar white'], files: [
    '08-player-jazz-bass-polar-white/1.jpg',
    '08-player-jazz-bass-polar-white/2.jpg',
    '08-player-jazz-bass-polar-white/3.jpg',
  ]},
  { match: ['mustang lt25'], files: [
    '09-mustang-lt25/1.jpg',
    '09-mustang-lt25/2.jpg',
    '09-mustang-lt25/3.jpg',
  ]},
  { match: ['tone master deluxe reverb'], files: ['10-tone-master-deluxe-reverb/1.jpg'] },
  { match: ['9050'], files: ['11-fender-9050-bass-strings/1.jpg'] },
  { match: ['locking tuners', 'chrome'], files: ['12-locking-tuners-chrome/1.jpg'] },
];

function getSet(product: Pick<Product, 'name'>): ImageSet | undefined {
  const name = product.name.toLowerCase().trim();
  return IMAGE_SETS.find(({ match }) => match.every((part) => name.includes(part)));
}

export function getProductImageUrls(product: Pick<Product, 'name'>): string[] {
  const set = getSet(product);
  if (!set) return [];
  if (set.urls) return set.urls;
  return (set.files ?? []).map((file) => `/product-images/${file}`);
}

export function getLocalProductImages(product: Pick<Product, 'id' | 'name'>): ProductImageSource[] {
  return getProductImageUrls(product).map((url, index) => ({
    id: `wave-local-${product.id}-${index + 1}`,
    product_id: product.id,
    url,
    alt: product.name,
    sort_order: index,
  }));
}

export function getPrimaryProductImage(product: Pick<Product, 'name'>): string {
  return getProductImageUrls(product)[0] ?? '';
}

export function applyProductImages<T extends Product>(product: T): T {
  const images = getLocalProductImages(product);
  return images.length ? ({ ...product, images } as T) : product;
}
