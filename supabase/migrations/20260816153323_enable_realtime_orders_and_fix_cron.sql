/*
# Enable realtime on orders table + fix advance-tracking cron to every 8 hours

1. Realtime
- Add `orders` table to the `supabase_realtime` publication so both the
  admin alarm sound and the customer Track & Trace page receive live
  INSERT/UPDATE events.
2. Cron schedule
- Drop the old daily (02:00) schedule.
- Re-schedule to run every 8 hours (02:10, 10:10, 18:10) so tracking
  advances one step every ~8h, completing the 5-step timeline within
  ~32h — fitting the 1-3 werkdagen delivery promise.
3. Notes
- No data changes. No new tables. No RLS changes.
*/

-- 1. Enable realtime on the orders table (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- 2. Re-schedule the advance-tracking cron job to run every 8 hours
DO $$
BEGIN
  PERFORM cron.unschedule('advance-tracking-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'advance-tracking-every-8h',
  '10 2,10,18 * * *',
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
