import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product } from './types';

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  image: string | null;
  quantity: number;
  maxStock: number;
  variantLabel?: string | null;
};

type CartContextType = {
  items: CartItem[];
  add: (product: Product, image: string | null, qty?: number, variantLabel?: string, variantKey?: string) => void;
  remove: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'wavegitaar-cart';
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add: CartContextType['add'] = (product, image, qty = 1, variantLabel, variantKey) => {
    const key = variantKey ? `${product.id}__${variantKey}` : product.id;
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: Math.min(i.quantity + qty, i.maxStock || 99) } : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          price: product.price,
          image,
          quantity: Math.min(qty, product.stock || 99),
          maxStock: product.stock || 99,
          variantLabel: variantLabel ?? null,
        },
      ];
    });
  };

  const remove: CartContextType['remove'] = (key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const updateQty: CartContextType['updateQty'] = (key, qty) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(qty, i.maxStock || 99) } : i))
    );
  };

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{ items, add, remove, updateQty, clear, count, subtotal, shipping, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
