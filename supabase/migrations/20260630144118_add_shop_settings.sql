CREATE TABLE IF NOT EXISTS shop_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  label text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_shop_settings" ON shop_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_insert_shop_settings" ON shop_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_shop_settings" ON shop_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_shop_settings" ON shop_settings FOR DELETE TO authenticated USING (true);

INSERT INTO shop_settings (key, value, label) VALUES
  ('iban', 'VUL HIER JE IBAN IN', 'IBAN rekeningnummer'),
  ('bic', 'VUL HIER JE BIC IN', 'BIC/SWIFT code'),
  ('bank_beneficiary', 'BBQ Dad', 'Tenaamstelling'),
  ('payment_days', '14', 'Betaaltermijn (dagen)')
ON CONFLICT (key) DO NOTHING;
