import { useMemo, useState } from 'react';
import type { Product } from '../lib/types';
import { getProductImageUrls } from '../lib/productImages';

export function ProductImageGallery({ product }: { product: Product }) {
  const mapped = useMemo(() => getProductImageUrls(product), [product]);
  const images = mapped.length ? mapped : (product.images ?? []).map((image) => image.url);
  const safeImages = images.filter(Boolean);
  const [active, setActive] = useState(0);

  if (!safeImages.length) {
    return <div className="flex aspect-square items-center justify-center bg-white text-stone-300">Geen productfoto beschikbaar</div>;
  }

  const current = safeImages[Math.min(active, safeImages.length - 1)];

  return (
    <div className="space-y-4">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white">
        <img src={current} alt={product.name} className="h-full w-full object-contain" />
      </div>
      {safeImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {safeImages.map((src, index) => (
            <button key={`${src}-${index}`} type="button" onClick={() => setActive(index)} className={`aspect-square overflow-hidden rounded-lg border bg-white ${index === active ? 'border-stone-900' : 'border-stone-200'}`}>
              <img src={src} alt={`${product.name} foto ${index + 1}`} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
