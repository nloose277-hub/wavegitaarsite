/*
# Add color and condition variants to products

1. New Columns
- `products.color_options` (jsonb, nullable) — array of color choices for a guitar.
  Each item: { "name": "Zwart", "hex": "#1a1a1a", "stock": 5, "price_adjustment": 0 }
  - `name`: display label shown to the customer
  - `hex`: hex color used for the swatch preview
  - `stock`: per-color stock count (optional, falls back to product stock)
  - `price_adjustment`: amount added to or subtracted from base price (optional, default 0)
- `products.condition_options` (jsonb, nullable) — array of condition/grade choices (e.g. new, B-stock, 2nd choice).
  Each item: { "name": "2e keuze", "description": "Lichte cosmetische beschadiging", "stock": 2, "price_adjustment": -100 }
  - `name`: display label
  - `description`: short explanation shown to the customer
  - `stock`: per-condition stock count (optional)
  - `price_adjustment`: discount or surcharge relative to base price (optional, default 0)

2. Notes
- Both columns are nullable. Products without variants behave exactly as before.
- No existing data is changed — existing products get NULL for both columns.
- Frontend reads these as JSON arrays. The admin UI lets the shop owner add/remove/edit entries.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS color_options jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS condition_options jsonb DEFAULT NULL;
