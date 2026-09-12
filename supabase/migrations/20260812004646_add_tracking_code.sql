-- Add tracking_code column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code text;

-- Generate tracking codes for existing paid orders that don't have one yet
UPDATE orders
SET tracking_code = 'WG-' || upper(substr(md5(random()::text || id::text), 1, 8))
WHERE tracking_code IS NULL AND payment_status = 'paid';

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code) WHERE tracking_code IS NOT NULL;

-- Drop old function first (signature changed)
DROP FUNCTION IF EXISTS public.get_order_tracking(text);

-- New function: look up by tracking_code, returns tracking_code too
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_tracking_code text)
RETURNS TABLE (
  order_number text,
  tracking_code text,
  status text,
  payment_status text,
  paid_at timestamptz,
  tracking_number text,
  created_at timestamptz,
  customer_first_name text,
  customer_last_name text,
  total numeric,
  items_json jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.order_number,
    o.tracking_code,
    o.status,
    o.payment_status,
    o.paid_at,
    o.tracking_number,
    o.created_at,
    o.customer_first_name,
    o.customer_last_name,
    o.total,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price
        )
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'::jsonb
    ) AS items_json
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE o.tracking_code = upper(p_tracking_code)
    AND o.payment_status = 'paid'
  GROUP BY o.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_tracking(text) TO anon, authenticated;
