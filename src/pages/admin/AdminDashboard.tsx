import { useEffect, useState, useCallback } from 'react';
import {
  Package, ShoppingCart, Euro, Star, TrendingUp, Users, Eye,
  Activity, ShoppingBag, MousePointerClick, Clock,
} from 'lucide-react';
import { fetchAdminOrders, fetchAdminProducts, fetchAllReviews } from '../../lib/api';
import { formatPrice, STATUS_LABELS, STATUS_COLORS } from '../../lib/types';
import type { Order, Product, Review } from '../../lib/types';
import { supabase } from '../../lib/supabase';

type CartEntry = { name: string; brand: string | null; price: number; quantity: number; image: string | null };
type VisitorSession = {
  session_id: string;
  current_page: string;
  last_seen_at: string;
  started_at: string;
  cart_items: CartEntry[] | null;
  cart_total: number | null;
  cart_count: number | null;
};

const ACTIVE_THRESHOLD_MS = 2 * 60 * 1000;

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 5) return 'nu';
  if (seconds < 60) return `${seconds}s geleden`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m geleden`;
}

function pageLabel(path: string): string {
  if (path === '/' ) return 'Home';
  if (path.startsWith('/products/')) return 'Productpagina';
  if (path.startsWith('/products')) return 'Producten';
  if (path === '/cart') return 'Winkelwagen';
  if (path === '/checkout') return 'Afrekenen';
  if (path === '/contact') return 'Contact';
  if (path === '/over-ons') return 'Over ons';
  if (path.startsWith('/tracken')) return 'Track & Trace';
  if (path.startsWith('/legal/')) return 'Juridisch';
  if (path.startsWith('/account')) return 'Account';
  if (path.startsWith('/admin')) return 'Admin';
  return path;
}

function LiveVisitors() {
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [, forceUpdate] = useState(0);

  const fetchActive = useCallback(async () => {
    const cutoff = new Date(Date.now() - ACTIVE_THRESHOLD_MS).toISOString();
    const { data } = await supabase
      .from('visitor_sessions')
      .select('session_id, current_page, last_seen_at, started_at, cart_items, cart_total, cart_count')
      .gte('last_seen_at', cutoff)
      .order('last_seen_at', { ascending: false });
    setSessions(data ?? []);
  }, []);

  useEffect(() => {
    fetchActive();
    const channel = supabase
      .channel('visitor-sessions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_sessions' }, () => fetchActive())
      .subscribe();

    const refreshInterval = window.setInterval(() => forceUpdate((n) => n + 1), 5000);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(refreshInterval);
    };
  }, [fetchActive]);

  const pageCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    const label = pageLabel(s.current_page);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  const sortedPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]);

  const visitorsWithCarts = sessions.filter((s) => s.cart_count && s.cart_count > 0);
  const totalCartValue = visitorsWithCarts.reduce((sum, s) => sum + (s.cart_total ?? 0), 0);

  const productCounts: Record<string, { count: number; qty: number }> = {};
  visitorsWithCarts.forEach((s) => {
    (s.cart_items ?? []).forEach((item) => {
      const key = item.name;
      if (!productCounts[key]) productCounts[key] = { count: 0, qty: 0 };
      productCounts[key].count += 1;
      productCounts[key].qty += item.quantity;
    });
  });
  const topCartProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">Online nu</span>
            <Activity className="h-4 w-4 text-green-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-stone-900">{sessions.length}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">Mandjes gevuld</span>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-stone-900">{visitorsWithCarts.length}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">Mandje-waarde totaal</span>
            <Euro className="h-4 w-4 text-green-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatPrice(totalCartValue)}</p>
        </div>
      </div>

      {/* Page popularity */}
      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center gap-2 border-b border-stone-200 p-5">
          <MousePointerClick className="h-5 w-5 text-stone-400" />
          <h2 className="font-semibold text-stone-900">Populairste pagina's</h2>
        </div>
        {sortedPages.length === 0 ? (
          <p className="p-8 text-center text-sm text-stone-400">Geen actieve bezoekers.</p>
        ) : (
          <div className="space-y-1.5 p-5">
            {sortedPages.map(([page, count]) => {
              const maxCount = sortedPages[0][1];
              const pct = (count / maxCount) * 100;
              return (
                <div key={page} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-stone-600">{page}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded bg-stone-100">
                    <div className="flex h-full items-center rounded bg-accent-500/30 px-2" style={{ width: `${pct}%` }}>
                      <span className="text-xs font-semibold text-accent-700">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top products in carts */}
      {topCartProducts.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center gap-2 border-b border-stone-200 p-5">
            <ShoppingBag className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold text-stone-900">Meest in mandje</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {topCartProducts.map(([name, info]) => (
              <div key={name} className="flex items-center justify-between p-4 text-sm">
                <span className="font-medium text-stone-900">{name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-stone-500">{info.count} mandje{info.count !== 1 ? 's' : ''}</span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{info.qty}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live visitor details */}
      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 p-5">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-stone-400" />
            <h2 className="font-semibold text-stone-900">Live bezoekers</h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-sm font-bold text-green-700">{sessions.length} online</span>
          </div>
        </div>

        {sessions.length === 0 ? (
          <p className="p-8 text-center text-sm text-stone-400">Geen actieve bezoekers op dit moment.</p>
        ) : (
          <div className="max-h-96 divide-y divide-stone-100 overflow-y-auto">
            {sessions.map((s) => (
              <div key={s.session_id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-3.5 w-3.5 text-stone-400" />
                    <span className="font-medium text-stone-700">{pageLabel(s.current_page)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <Clock className="h-3 w-3" />
                    {timeAgo(s.last_seen_at)}
                  </div>
                </div>
                {s.cart_count && s.cart_count > 0 ? (
                  <div className="mt-2 rounded-lg bg-blue-50/60 p-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        {s.cart_count} artikel{s.cart_count !== 1 ? 'en' : ''} in mandje
                      </span>
                      <span className="text-xs font-bold text-blue-700">{formatPrice(s.cart_total ?? 0)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(s.cart_items ?? []).slice(0, 4).map((item, idx) => (
                        <span key={idx} className="rounded bg-white px-2 py-1 text-xs text-stone-600 shadow-sm">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                      {(s.cart_items ?? []).length > 4 && (
                        <span className="rounded bg-white px-2 py-1 text-xs text-stone-400 shadow-sm">
                          +{(s.cart_items ?? []).length - 4} meer
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-stone-400">Geen items in mandje</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [o, p, r] = await Promise.all([
          fetchAdminOrders(),
          fetchAdminProducts(),
          fetchAllReviews(),
        ]);
        setOrders(o);
        setProducts(p);
        setReviews(r);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalRevenue = orders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + o.total, 0);
  const pendingReviews = reviews.filter((r) => !r.is_approved).length;
  const recentOrders = orders.slice(0, 5);

  // Customer insights from orders
  const customerMap: Record<string, { email: string; name: string; orders: number; spent: number; lastOrder: string }> = {};
  orders.forEach((o) => {
    const email = o.customer_email ?? 'onbekend';
    const name = [o.customer_first_name, o.customer_last_name].filter(Boolean).join(' ') || 'Onbekend';
    if (!customerMap[email]) {
      customerMap[email] = { email, name, orders: 0, spent: 0, lastOrder: o.created_at };
    }
    customerMap[email].orders += 1;
    if (o.payment_status === 'paid') customerMap[email].spent += o.total;
    if (new Date(o.created_at) > new Date(customerMap[email].lastOrder)) {
      customerMap[email].lastOrder = o.created_at;
    }
  });
  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const stats = [
    { label: 'Omzet (betaald)', value: formatPrice(totalRevenue), icon: Euro, color: 'text-green-600' },
    { label: 'Bestellingen', value: orders.length, icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'Producten', value: products.length, icon: Package, color: 'text-stone-600' },
    { label: 'Open reviews', value: pendingReviews, icon: Star, color: 'text-amber-600' },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-stone-300 border-t-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-stone-900">{s.value}</p>
          </div>
        ))}
      </div>

      <LiveVisitors />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center gap-2 border-b border-stone-200 p-5">
            <TrendingUp className="h-5 w-5 text-stone-400" />
            <h2 className="font-semibold text-stone-900">Recente bestellingen</h2>
          </div>
          {recentOrders.length === 0 ? (
            <p className="p-8 text-center text-sm text-stone-400">Nog geen bestellingen.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <span className="font-medium text-stone-900">{o.order_number}</span>
                    <span className="ml-3 text-stone-500">{o.customer_email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge border ${STATUS_COLORS[o.status] ?? ''}`}>{STATUS_LABELS[o.status] ?? o.status}</span>
                    <span className="font-semibold text-stone-900">{formatPrice(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top customers */}
        <div className="rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center gap-2 border-b border-stone-200 p-5">
            <Users className="h-5 w-5 text-stone-400" />
            <h2 className="font-semibold text-stone-900">Top klanten</h2>
          </div>
          {topCustomers.length === 0 ? (
            <p className="p-8 text-center text-sm text-stone-400">Nog geen klanten.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {topCustomers.map((c) => (
                <div key={c.email} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <p className="font-medium text-stone-900">{c.name}</p>
                    <p className="text-xs text-stone-500">{c.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-stone-900">{formatPrice(c.spent)}</p>
                    <p className="text-xs text-stone-500">{c.orders} bestelling{c.orders !== 1 ? 'en' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
