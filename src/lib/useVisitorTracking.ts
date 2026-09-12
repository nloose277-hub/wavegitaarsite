import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from './supabase';
import type { CartItem } from './cart';

const SESSION_KEY = 'wavegitaar-session-id';
const HEARTBEAT_MS = 30_000;

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function upsertSession(
  sessionId: string,
  page: string,
  cartItems?: CartItem[],
) {
  const payload: Record<string, unknown> = {
    session_id: sessionId,
    current_page: page,
    last_seen_at: new Date().toISOString(),
  };

  if (cartItems !== undefined) {
    payload.cart_items = cartItems.map((i) => ({
      name: i.name,
      brand: i.brand,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    }));
    payload.cart_total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    payload.cart_count = cartItems.reduce((s, i) => s + i.quantity, 0);
  }

  await supabase.from('visitor_sessions').upsert(payload, {
    onConflict: 'session_id',
  });
}

export function useVisitorTracking(cartItems?: CartItem[]) {
  const { pathname } = useLocation();
  const sessionIdRef = useRef<string>(getSessionId());
  const cartRef = useRef<CartItem[] | undefined>(cartItems);
  cartRef.current = cartItems;

  useEffect(() => {
    upsertSession(sessionIdRef.current, pathname, cartRef.current);

    const interval = window.setInterval(() => {
      upsertSession(sessionIdRef.current, window.location.pathname, cartRef.current);
    }, HEARTBEAT_MS);

    const handleVisibility = () => {
      if (!document.hidden) {
        upsertSession(sessionIdRef.current, window.location.pathname, cartRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [pathname]);

  useEffect(() => {
    upsertSession(sessionIdRef.current, pathname, cartItems);
  }, [cartItems, pathname]);
}
