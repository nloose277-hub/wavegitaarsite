/*
# Add cart tracking columns to visitor_sessions

1. Modified Tables
- `visitor_sessions`
  - Add `cart_items` (jsonb, nullable) — array of cart items the visitor currently has in their cart, stored silently for admin analytics. Each item: { name, brand, price, quantity, image }
  - Add `cart_total` (numeric, default 0) — total monetary value of the visitor's cart
  - Add `cart_count` (integer, default 0) — total number of items in the visitor's cart

2. Purpose
- Allows the admin dashboard to see what visitors are putting in their carts in real-time
- Shows which products are being browsed and added to carts most frequently
- All tracking is anonymous (session_id only) — visitors are not aware of this

3. Security
- No policy changes needed — existing INSERT/UPDATE policies already allow anon to upsert their own session
- SELECT remains authenticated-only (admin)
*/

ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS cart_items jsonb;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS cart_total numeric DEFAULT 0;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS cart_count integer DEFAULT 0;