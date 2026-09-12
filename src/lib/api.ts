import { supabase } from './supabase';
import type {
  Product, ProductImage, Category, Review, Order, OrderItem,
  Payment, PaymentProvider, SiteSetting, SiteContent, WhatsappSettings, LegalPage,
} from './types';

// ---- Categories ----
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---- Products ----
export async function fetchProducts(opts: {
  category?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
} = {}): Promise<Product[]> {
  let q = supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });
  if (opts.featured) q = q.eq('is_featured', true);
  if (opts.category) q = q.eq('category_id', opts.category);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function searchProducts(query: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_visible', true)
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%,short_description.ilike.%${query}%`)
    .order('display_order', { ascending: true })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Product) ?? null;
}

export async function fetchProductImages(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---- Reviews ----
export async function fetchReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('is_approved', true)
    .eq('is_example', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, product:products(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type ReviewSummary = { count: number; avg: number };

export async function fetchReviewSummaries(): Promise<Record<string, ReviewSummary>> {
  const { data, error } = await supabase
    .from('reviews')
    .select('product_id, rating')
    .eq('is_approved', true)
    .eq('is_example', false);
  if (error) throw error;
  const map: Record<string, ReviewSummary> = {};
  (data ?? []).forEach((row: { product_id: string; rating: number }) => {
    const existing = map[row.product_id];
    if (existing) {
      existing.count++;
      existing.avg += row.rating;
    } else {
      map[row.product_id] = { count: 1, avg: row.rating };
    }
  });
  Object.values(map).forEach((s) => { s.avg = s.avg / s.count; });
  return map;
}

export async function createReview(review: {
  product_id: string;
  author_name: string;
  rating: number;
  title?: string;
  body?: string;
}): Promise<void> {
  const { error } = await supabase.from('reviews').insert({
    product_id: review.product_id,
    author_name: review.author_name,
    rating: review.rating,
    title: review.title ?? null,
    body: review.body ?? null,
    is_approved: false,
  });
  if (error) throw error;
}

// ---- Site Content ----
export async function fetchSiteContent(): Promise<Record<string, SiteContent>> {
  const { data, error } = await supabase.from('site_content').select('*');
  if (error) throw error;
  const map: Record<string, SiteContent> = {};
  (data ?? []).forEach((row) => { map[row.section] = row as SiteContent; });
  return map;
}

// ---- Site Settings ----
export async function fetchSiteSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('site_settings').select('*');
  if (error) throw error;
  const map: Record<string, string> = {};
  (data ?? []).forEach((row: SiteSetting) => { map[row.key] = row.value ?? ''; });
  return map;
}

// ---- WhatsApp Settings ----
export async function fetchWhatsappSettings(): Promise<WhatsappSettings | null> {
  const { data, error } = await supabase
    .from('whatsapp_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as WhatsappSettings | null;
}

// ---- Legal Pages ----
export async function fetchLegalPages(): Promise<LegalPage[]> {
  const { data, error } = await supabase
    .from('legal_pages')
    .select('*')
    .eq('is_published', true)
    .order('title', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchLegalPage(slug: string): Promise<LegalPage | null> {
  const { data, error } = await supabase
    .from('legal_pages')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as LegalPage | null;
}

// ---- Payment Providers ----
export async function fetchEnabledPaymentProviders(): Promise<PaymentProvider[]> {
  const { data, error } = await supabase
    .from('payment_providers')
    .select('*')
    .eq('is_enabled', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---- Orders ----
export type CartLine = {
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  quantity: number;
  unit_price: number;
  total: number;
};

export async function createOrder(order: {
  customer_email: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_phone?: string;
  shipping_address: Record<string, unknown>;
  items: CartLine[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method?: string;
  notes?: string;
  pending?: boolean;
}): Promise<{ id: string; order_number: string; tracking_code: string }> {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(order),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Bestelling aanmaken mislukt (${res.status})`);
  if (!json.id) throw new Error('Bestelling aanmaken mislukt: geen id ontvangen');
  return json;
}

// ---- Admin: Orders ----
export async function fetchAdminOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  const isPaid = ['betaald', 'verzonden', 'afgerond', 'ontvangen', 'verwerkt', 'voorbereid', 'afgeleverd'].includes(status);
  const updates: Record<string, string> = { status };
  if (isPaid) {
    updates.payment_status = 'paid';
    updates.paid_at = new Date().toISOString();
  }
  const { error } = await supabase.from('orders').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteOrder(id: string): Promise<void> {
  const { error: itemsError } = await supabase.from('order_items').delete().eq('order_id', id);
  if (itemsError) throw itemsError;
  const { error: paymentsError } = await supabase.from('payments').delete().eq('order_id', id);
  if (paymentsError) throw paymentsError;
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

export type TrackingInfo = {
  order_number: string;
  tracking_code: string | null;
  status: string;
  payment_status: string;
  paid_at: string | null;
  tracking_number: string | null;
  created_at: string;
  customer_first_name: string | null;
  customer_last_name: string | null;
  total: number;
  items: { product_name: string; quantity: number; unit_price: number }[];
};

export async function fetchTracking(trackingCode: string): Promise<TrackingInfo | null> {
  const { data, error } = await supabase.rpc('get_order_tracking', { p_tracking_code: trackingCode.toUpperCase() });
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const row = data[0];
  return {
    order_number: row.order_number,
    tracking_code: row.tracking_code,
    status: row.status,
    payment_status: row.payment_status,
    paid_at: row.paid_at,
    tracking_number: row.tracking_number,
    created_at: row.created_at,
    customer_first_name: row.customer_first_name,
    customer_last_name: row.customer_last_name,
    total: Number(row.total),
    items: row.items_json ?? [],
  };
}

export async function updateOrderTracking(id: string, trackingNumber: string): Promise<void> {
  const { error } = await supabase.from('orders').update({ tracking_number: trackingNumber }).eq('id', id);
  if (error) throw error;
}

// ---- Admin: Payments ----
export async function fetchAdminPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*, order:orders(order_number, customer_email)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAdminPaymentProviders(): Promise<PaymentProvider[]> {
  const { data, error } = await supabase
    .from('payment_providers')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updatePaymentProvider(id: string, updates: Partial<PaymentProvider>): Promise<void> {
  const { error } = await supabase.from('payment_providers').update(updates).eq('id', id);
  if (error) throw error;
}

// ---- Admin: Customers ----
export async function fetchAdminCustomers(): Promise<import('./types').Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---- Admin: Products ----
export async function fetchAdminProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images'>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const { error } = await supabase.from('products').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchAdminProductImages(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addProductImage(productId: string, url: string, alt: string, sortOrder: number): Promise<void> {
  const { error } = await supabase
    .from('product_images')
    .insert({ product_id: productId, url, alt, sort_order: sortOrder });
  if (error) throw error;
}

export async function deleteProductImage(id: string): Promise<void> {
  const { error } = await supabase.from('product_images').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `${fileName}`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);
  return urlData.publicUrl;
}

// ---- Admin: Categories ----
export async function createCategory(cat: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  const { error } = await supabase.from('categories').insert(cat);
  if (error) throw error;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const { error } = await supabase.from('categories').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ---- Admin: Reviews ----
export async function updateReview(id: string, updates: Partial<Review>): Promise<void> {
  const { error } = await supabase.from('reviews').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
}

// ---- Admin: Site Settings ----
export async function updateSiteSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}

export async function fetchAllSiteSettings(): Promise<SiteSetting[]> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('category, key', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---- Admin: Site Content ----
export async function fetchAllSiteContent(): Promise<SiteContent[]> {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .order('section', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateSiteContent(section: string, updates: Partial<SiteContent>): Promise<void> {
  const { error } = await supabase
    .from('site_content')
    .upsert({ section, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'section' });
  if (error) throw error;
}

// ---- Admin: WhatsApp ----
export async function fetchAdminWhatsappSettings(): Promise<WhatsappSettings | null> {
  const { data, error } = await supabase
    .from('whatsapp_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as WhatsappSettings | null;
}

export async function updateWhatsappSettings(id: string, updates: Partial<WhatsappSettings>): Promise<void> {
  const { error } = await supabase.from('whatsapp_settings').update(updates).eq('id', id);
  if (error) throw error;
}

// ---- Admin: Legal Pages ----
export async function fetchAllLegalPages(): Promise<LegalPage[]> {
  const { data, error } = await supabase
    .from('legal_pages')
    .select('*')
    .order('title', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateLegalPage(id: string, updates: Partial<LegalPage>): Promise<void> {
  const { error } = await supabase.from('legal_pages').update(updates).eq('id', id);
  if (error) throw error;
}

export async function createLegalPage(page: { slug: string; title: string; body: string }): Promise<void> {
  const { error } = await supabase.from('legal_pages').insert(page);
  if (error) throw error;
}
