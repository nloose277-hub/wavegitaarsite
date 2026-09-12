CREATE TABLE contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_contact_messages" ON contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "select_contact_messages_admin" ON contact_messages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "update_contact_messages_admin" ON contact_messages
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "delete_contact_messages_admin" ON contact_messages
  FOR DELETE TO authenticated
  USING (true);
