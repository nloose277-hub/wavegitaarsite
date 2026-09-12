
-- App config table (only readable by service_role via edge functions)
CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
-- No public policies: only service_role (bypasses RLS) can read this table

-- Store Resend API key
INSERT INTO app_config (key, value)
VALUES ('RESEND_API_KEY', 're_CP3j2qw4_96Kncmd2zUrB35UVwqqE1kFb')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Add missing INSERT policy for anon on order_items
-- (edge function uses service_role so this is a safety net for direct client calls)
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
