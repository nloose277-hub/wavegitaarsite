-- Update the handle_new_user trigger function to capture Google OAuth name metadata.
-- Google sends full_name, name, given_name, family_name in raw_user_meta_data.
-- Also falls back to first_name/last_name (used by email/password sign-up).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_first_name text;
  v_last_name text;
  v_full_name text;
BEGIN
  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    ''
  );
  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    ''
  );
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );

  -- If individual names are empty but full_name is present, split it
  IF v_first_name = '' AND v_last_name = '' AND v_full_name <> '' THEN
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := CASE
      WHEN position(' ' in v_full_name) > 0
      THEN substring(v_full_name from position(' ' in v_full_name) + 1)
      ELSE ''
    END;
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), profiles.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), profiles.last_name);
  RETURN NEW;
END;
$function$;
