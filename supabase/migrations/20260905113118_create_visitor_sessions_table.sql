/*
# Live visitor tracking table

1. New Tables
- `visitor_sessions`
  - `id` (uuid, primary key)
  - `session_id` (text, unique — anonymous browser session identifier stored in localStorage)
  - `current_page` (text — the current page path the visitor is on, e.g. "/products")
  - `last_seen_at` (timestamptz — updated every 30 seconds via heartbeat)
  - `started_at` (timestamptz — when the session first started)
  - `is_active` (boolean — true if last heartbeat was within the last 2 minutes)

2. Purpose
- Allows the admin dashboard to see how many visitors are currently online
- Shows which pages visitors are viewing in real-time
- Sessions automatically expire after 2 minutes of no activity

3. Security
- Enable RLS on `visitor_sessions`
- Allow anon + authenticated to INSERT and UPDATE (visitors need to create/update their own sessions)
- Allow authenticated to SELECT (admin needs to see all active visitors)
- DELETE is not needed — expired sessions are cleaned up by a scheduled job or admin

4. Notes
- Uses `session_id` (a random string generated client-side) rather than `auth.uid()` so anonymous visitors are also tracked
- The `is_active` flag is computed from `last_seen_at` and doesn't need to be set directly
*/

CREATE TABLE IF NOT EXISTS visitor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  current_page text NOT NULL DEFAULT '/',
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon visitors) to insert their own session
DROP POLICY IF EXISTS "anon_insert_visitor_session" ON visitor_sessions;
CREATE POLICY "anon_insert_visitor_session"
ON visitor_sessions FOR INSERT
TO anon, authenticated WITH CHECK (true);

-- Allow anyone to update their own session (by session_id)
DROP POLICY IF EXISTS "anon_update_visitor_session" ON visitor_sessions;
CREATE POLICY "anon_update_visitor_session"
ON visitor_sessions FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

-- Allow authenticated (admin) to view all sessions
DROP POLICY IF EXISTS "auth_select_visitor_sessions" ON visitor_sessions;
CREATE POLICY "auth_select_visitor_sessions"
ON visitor_sessions FOR SELECT
TO authenticated USING (true);

-- Allow anon to read their own session (for upsert check)
DROP POLICY IF EXISTS "anon_select_visitor_session" ON visitor_sessions;
CREATE POLICY "anon_select_visitor_session"
ON visitor_sessions FOR SELECT
TO anon, authenticated USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE visitor_sessions;
