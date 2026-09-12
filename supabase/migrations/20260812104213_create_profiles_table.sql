/*
# Create profiles table for customer accounts

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique, not null)
  - `title` (text: 'mevrouw' | 'de_heer' | 'geen' — how to address the customer)
  - `first_name` (text, not null)
  - `infix` (text, nullable — tussenvoegsel)
  - `last_name` (text, not null)
  - `country` (text: 'Nederland' | 'België' | 'Anders')
  - `postal_code` (text)
  - `house_number` (text)
  - `street` (text)
  - `city` (text)
  - `phone` (text, nullable)
  - `birth_date` (date, nullable, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `profiles`.
- Owner-scoped CRUD: each authenticated user can only access their own profile row.
- A trigger auto-creates a profile row when a new auth user signs up (handles Google OAuth users too).

3. Notes
- The `id` column equals `auth.users.id`, making it a 1:1 extension of Supabase Auth.
- The trigger ensures Google OAuth users also get a profile row automatically.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT 'geen',
  first_name text NOT NULL DEFAULT '',
  infix text,
  last_name text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'Nederland',
  postal_code text,
  house_number text,
  street text,
  city text,
  phone text,
  birth_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();
