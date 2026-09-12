/*
# Enable site private mode setting

1. Changes
- Inserts a new `site_private` row into `site_settings` (category: general, value: 'true').
- When `site_private = 'true'`, the frontend shows a private/maintenance screen for all public pages.
- Admin pages remain accessible so the owner can still manage the site.
2. Security
- No table structure changes; existing RLS policies on `site_settings` remain unchanged.
*/

INSERT INTO site_settings (key, value, category, updated_at)
VALUES ('site_private', 'true', 'general', now())
ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = now();
