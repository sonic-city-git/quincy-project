-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the cron job to run every hour
SELECT cron.schedule(
  'sync-tripletex-customers',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://dlspsnjhpmzwxfjajsoa.supabase.co/functions/v1/sync-customers',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) AS request_id;
  $$
);