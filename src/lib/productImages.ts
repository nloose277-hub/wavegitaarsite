import type { Product } from '../lib/types';

export type LocalProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt: string;
  sort_order: number;
};

type Rule = {
  match: string[];
  folder: string;
  files: string[];
};

const RULES: Rule[] = [
  {
    match: ['player stratocaster', 'black'],
    folder: '01-player-stratocaster-black',
    files: ['1.jpg', '2.jpg', '3.jpg'],
  },
  {
    match: ['player stratocaster', 'olympic pearl'],
    folder: '02-player-stratocaster-olympic-pearl',
    files: [],
  },
  {
    match: ['american professional ii stratocaster'],
    folder: '03-american-professional-ii-stratocaster',
    files: ['1.jpg', '2.jpg', '3.jpg'],
  },
  {
    match: ['player telecaster', 'butterscotch blonde'],
    folder: '04-player-telecaster-butterscotch-blonde',
    files: ['1.jpg', '2.jpg'],
  },
  {
    match: ['american professional ii telecaster'],
    folder: '05-american-professional-ii-telecaster',
    files: [
      'REVIEW-do-not-use-yet-b-detail.jpg',
      'REVIEW-do-not-use-yet-back.jpg',
    ],
  },
  {
    match: ['player jazzmaster', 'polar white'],
    folder: '06-player-jazzmaster-polar-white',
    files: ['1.jpg', '2.jpg'],
  },
  {
    match: ['player precision bass', 'black'],
    folder: '07-player-precision-bass-black',
    files: ['1.jpg', '2.jpg', '3.jpg'],
  },
  {
    match: ['player jazz bass', 'polar white'],
    folder: '08-player-jazz-bass-polar-white',
    files: ['1.jpg', '2.jpg', '3.jpg'],
  },
  {
    match: ['mustang lt25'],
    folder: '09-mustang-lt25',
    files: ['1.jpg', '2.jpg', '3.jpg'],
  },
  {
    match: ['tone master deluxe reverb'],
    folder: '10-tone-master-deluxe-reverb',
    files: ['1.jpg'],
  },
  {
    match: ['9050'],
    folder: '11-fender-9050-bass-strings',
    files: ['1.jpg'],
  },
  {
    match: ['locking tuners', 'chrome'],
    folder: '12-locking-tuners-chrome',
    files: ['1.jpg'],
  },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[–—-]/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getLocalProductImages(product: Product): LocalProductImage[] {
  const name = normalize(product.name);

  const rule = RULES.find((candidate) =>
    candidate.match.every((part) => name.includes(normalize(part)))
  );

  if (!rule) return [];

  return rule.files.map((file, index) => ({
    id: `local-${product.id}-${index + 1}`,
    product_id: product.id,
    url: `/product-images/${rule.folder}/${file}`,
    alt: product.name,
    sort_order: index,
  }));
}

export function getPrimaryLocalProductImage(product: Product): string {
  return getLocalProductImages(product)[0]?.url ?? '';
}
