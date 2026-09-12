/*
# Add bank IBAN setting

Adds a `bank_iban` site setting under the `general` category so the
admin can change the bank account number shown to customers on the
manual transfer payment screen.

1. New data
- `site_settings` row: key = 'bank_iban', value = 'NL00 XXXX 00 00 0000 00', category = 'general'
2. Security
- No table or policy changes — site_settings already has anon/authenticated RLS.
*/

INSERT INTO site_settings (key, value, category)
VALUES ('bank_iban', 'NL00 XXXX 00 00 0000 00', 'general')
ON CONFLICT (key) DO NOTHING;
