-- Lightweight migration to fix the user creation trigger
-- This does NOT attempt to backfill data to prevent timeouts

-- 1. Drop existing trigger to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Define the robust function (handles missing metadata/types safely)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_id uuid;
  v_role text;
  v_full_name text;
BEGIN
  -- Extract metadata with defaults
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.email);
  
  -- Safe UUID casting for school_id
  BEGIN
    IF new.raw_user_meta_data->>'school_id' IS NOT NULL AND new.raw_user_meta_data->>'school_id' != '' THEN
      v_school_id := (new.raw_user_meta_data->>'school_id')::uuid;
    ELSE
      v_school_id := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_school_id := NULL;
  END;

  -- Insert profile with conflict handling
  INSERT INTO public.profiles (id, name, email, role, school_id)
  VALUES (
    new.id,
    v_full_name,
    new.email,
    v_role,
    v_school_id
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    school_id = COALESCE(EXCLUDED.school_id, profiles.school_id);

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Prevent auth blocking on error
  RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$;

-- 3. Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
