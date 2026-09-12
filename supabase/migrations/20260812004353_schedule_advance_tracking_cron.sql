-- Schedule the advance-tracking edge function to run daily via pg_cron + pg_net
-- This calls the edge function every day at 02:00 AM which auto-advances paid orders
-- through the tracking timeline (every 2 days = 1 step forward)

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing schedule if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('advance-tracking-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Schedule daily at 02:00 AM
SELECT cron.schedule(
  'advance-tracking-daily',
  '0 2 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/advance-tracking',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
