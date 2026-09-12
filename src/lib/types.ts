export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_price: number | null;
  sku: string | null;
  stock: number;
  weight: string | null;
  lead_time: string | null;
  specifications: Record<string, string> | null;
  features: string[] | null;
  is_visible: boolean;
  is_featured: boolean;
  badge: string | null;
  meta_title: string | null;
  meta_description: string | null;
  display_order: number;
  color_options: ColorOption[] | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  images?: ProductImage[];
};

export type ColorOption = {
  name: string;
  hex: string;
  stock?: number | null;
  price_adjustment?: number | null;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
};

export type Review = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  is_example: boolean;
  source: string;
  avatar_url: string | null;
  created_at: string;
};

export type Customer = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  created_at: string;
};

export type OrderStatus = 'nieuw' | 'in_behandeling' | 'betaald' | 'verzonden' | 'afgerond' | 'geannuleerd';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export type Order = {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_email: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_phone: string | null;
  shipping_address: Record<string, unknown> | null;
  notes: string | null;
  status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method: string | null;
  payment_provider: string | null;
  payment_status: string;
  payment_intent_id: string | null;
  tracking_number: string | null;
  tracking_code: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  quantity: number;
  unit_price: number;
  total: number;
};

export type Payment = {
  id: string;
  order_id: string;
  provider_code: string;
  payment_method: string | null;
  amount: number;
  status: string;
  transaction_ref: string | null;
  refund_amount: number;
  refund_status: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PaymentProvider = {
  id: string;
  code: string;
  name: string;
  is_enabled: boolean;
  is_default: boolean;
  mode: string;
  config: Record<string, string>;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SiteSetting = {
  id: string;
  key: string;
  value: string | null;
  category: string;
};

export type SiteContent = {
  id: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
};

export type WhatsappSettings = {
  id: string;
  is_enabled: boolean;
  employee_name: string;
  employee_status: string;
  phone_number: string;
  profile_image_url: string | null;
  welcome_message: string;
  show_on_desktop: boolean;
  show_on_mobile: boolean;
  button_position: string;
};

export type LegalPage = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  is_published: boolean;
  updated_at: string;
};

export const STATUS_LABELS: Record<string, string> = {
  nieuw: 'Nieuw',
  in_behandeling: 'In behandeling',
  betaald: 'Betaald',
  verzonden: 'Verzonden',
  afgerond: 'Afgerond',
  geannuleerd: 'Geannuleerd',
  ontvangen: 'Ontvangen',
  verwerkt: 'Verwerkt',
  voorbereid: 'Voorbereid',
  afgeleverd: 'Afgeleverd',
};

export const STATUS_COLORS: Record<string, string> = {
  nieuw: 'bg-blue-50 text-blue-700 border-blue-200',
  in_behandeling: 'bg-amber-50 text-amber-700 border-amber-200',
  betaald: 'bg-green-50 text-green-700 border-green-200',
  verzonden: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  afgerond: 'bg-stone-100 text-stone-700 border-stone-200',
  geannuleerd: 'bg-red-50 text-red-700 border-red-200',
  ontvangen: 'bg-blue-50 text-blue-700 border-blue-200',
  verwerkt: 'bg-amber-50 text-amber-700 border-amber-200',
  voorbereid: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  afgeleverd: 'bg-green-50 text-green-700 border-green-200',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'In afwachting',
  paid: 'Betaald',
  failed: 'Mislukt',
  cancelled: 'Geannuleerd',
  refunded: 'Terugbetaald',
};

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getStockStatus(stock: number): { label: string; color: string } {
  if (stock > 5) return { label: 'Op voorraad', color: 'text-green-700' };
  if (stock > 0) return { label: `Nog ${stock} op voorraad`, color: 'text-amber-700' };
  return { label: 'Niet op voorraad', color: 'text-red-700' };
}
