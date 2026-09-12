-- Add paid_at timestamp to track when payment was confirmed
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- SECURITY DEFINER function: allows anon users to look up tracking info by order number
-- Only returns data for paid orders, and only tracking-relevant fields (no sensitive data)
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_number text)
RETURNS TABLE (
  order_number text,
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
  WHERE o.order_number = p_order_number
    AND o.payment_status = 'paid'
  GROUP BY o.id;
$$;

-- Allow anon and authenticated to call the tracking function
GRANT EXECUTE ON FUNCTION public.get_order_tracking(text) TO anon, authenticated;
