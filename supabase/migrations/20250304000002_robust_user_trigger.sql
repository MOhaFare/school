-- 1. Drop existing trigger to ensure we start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create a robust handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  meta_role text;
  meta_full_name text;
  meta_school_id uuid;
  raw_school_id text;
BEGIN
  -- Extract metadata safely
  meta_role := new.raw_user_meta_data->>'role';
  meta_full_name := new.raw_user_meta_data->>'full_name';
  raw_school_id := new.raw_user_meta_data->>'school_id';

  -- Default role to 'student' if missing or invalid
  IF meta_role IS NULL OR meta_role = '' THEN
    meta_role := 'student';
  END IF;

  -- Default name to email if missing
  IF meta_full_name IS NULL OR meta_full_name = '' THEN
    meta_full_name := new.email;
  END IF;

  -- Handle School ID safely (convert empty strings/nulls to database NULL)
  BEGIN
    IF raw_school_id IS NOT NULL AND raw_school_id != '' AND raw_school_id != 'null' THEN
      meta_school_id := raw_school_id::uuid;
    ELSE
      meta_school_id := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If casting fails (invalid UUID), default to NULL to prevent crash
    meta_school_id := NULL;
  END;

  -- Insert into profiles, updating if it already exists (idempotent)
  INSERT INTO public.profiles (id, email, name, role, school_id)
  VALUES (
    new.id,
    new.email,
    meta_full_name,
    meta_role,
    meta_school_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    school_id = EXCLUDED.school_id;

  RETURN new;
END;
$$;

-- 3. Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. BACKFILL SCRIPT: Create profiles for any existing users that are missing them
INSERT INTO public.profiles (id, email, name, role, school_id)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email),
  COALESCE(raw_user_meta_data->>'role', 'student'),
  (CASE 
    WHEN raw_user_meta_data->>'school_id' IS NULL OR raw_user_meta_data->>'school_id' = '' OR raw_user_meta_data->>'school_id' = 'null' THEN NULL 
    ELSE (raw_user_meta_data->>'school_id')::uuid 
   END)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
