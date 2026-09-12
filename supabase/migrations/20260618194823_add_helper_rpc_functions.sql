/*
# Helper RPC functions

1. New Functions
- `increment_coupon_usage(code_arg text)` — atomic increment of used_count for a coupon code.
- `decrement_stock(product_id_arg uuid, qty_arg int)` — atomic decrement of product stock (floor 0).

2. Security
- Both functions SECURITY DEFINER so the anon client can call them despite RLS.
- Used by the `create-order` edge function after orders are inserted.
*/

CREATE OR REPLACE FUNCTION increment_coupon_usage(code_arg text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = UPPER(code_arg);
END;
$$;

CREATE OR REPLACE FUNCTION decrement_stock(product_id_arg uuid, qty_arg int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - qty_arg)
  WHERE id = product_id_arg;
END;
$$;

-- Helper to compute averages / reviews aggregate for product page
CREATE OR REPLACE FUNCTION product_avg_rating(p_id uuid)
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(rating), 0)::numeric(3,1) FROM product_reviews
  WHERE product_id = p_id AND is_approved = true;
$$;
