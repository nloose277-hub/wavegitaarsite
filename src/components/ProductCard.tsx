import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Check } from 'lucide-react';
import type { Product } from '../lib/types';
import { formatPrice, getStockStatus } from '../lib/types';
import { useCart } from '../lib/cart';
import { getPrimaryLocalProductImage } from '../lib/productImages';

export function ProductCard({
  product,
  reviewSummary,
}: {
  product: Product;
  image?: string;
  reviewSummary?: { count: number; avg: number };
}) {
  const { add } = useCart();
  const stock = getStockStatus(product.stock);

  // Local product photo ALWAYS wins.
  const img = getPrimaryLocalProductImage(product);

  const reviewCount = reviewSummary?.count ?? 0;
  const avgRating = reviewSummary?.avg ?? 0;
  const hasDiscount = !!(product.compare_price && product.compare_price > product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0;

  const [added, setAdded] = useState(false);
  const [imageSrc, setImageSrc] = useState(img);

  useEffect(() => {
    setImageSrc(img);
  }, [img]);

  const handleAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    add(product, imageSrc, 1);
    setAdded(true);

    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition-all duration-300 hover:border-stone-300 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <ShoppingBag className="h-10 w-10" />
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              -{discountPercent}%
            </span>
          )}

          {product.badge && (
            <span className="rounded bg-accent-600 px-2 py-0.5 text-xs font-bold text-white">
              {product.badge}
            </span>
          )}
        </div>

        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="rounded-md bg-stone-500 px-3 py-1.5 text-sm font-bold text-white">
              Uitverkocht
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-xs font-medium text-stone-400">{product.brand}</p>

        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-stone-900 transition-colors group-hover:text-accent-700">
          {product.name}
        </h3>

        {reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.round(avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-stone-400">({reviewCount})</span>
          </div>
        )}

        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              product.stock > 0 ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <p className={`text-xs ${stock.color}`}>{stock.label}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <div className="flex flex-col">
            <span className="text-base font-bold text-stone-900">
              {formatPrice(product.price)}
            </span>

            {hasDiscount && (
              <span className="text-xs text-stone-400 line-through">
                {formatPrice(product.compare_price!)}
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stock === 0 || !imageSrc}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all disabled:opacity-30 ${
              added
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-stone-300 bg-white text-stone-700 hover:border-accent-600 hover:bg-accent-600 hover:text-white'
            }`}
            aria-label="Toevoegen aan winkelwagen"
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </Link>
  );
}
