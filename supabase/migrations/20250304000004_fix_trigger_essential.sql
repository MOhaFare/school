/*
  # Fix User Creation Trigger (Essential)
  
  This migration replaces the user creation trigger with a robust version.
  It handles:
  1. Profile creation in public.profiles
  2. Automatic linking of Students/Teachers based on email
  3. Safe type casting for school_id to prevent errors
  
  Note: This does NOT backfill existing missing profiles to avoid timeouts.
*/

-- Drop existing trigger to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or Replace the function with robust logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  school_id_val uuid;
BEGIN
  -- 1. Safe casting for school_id (handles empty strings, nulls, and invalid UUIDs)
  BEGIN
    school_id_val := NULLIF(new.raw_user_meta_data->>'school_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    school_id_val := NULL; -- Fallback to NULL if invalid UUID
  END;

  -- 2. Insert or Update Profile
  INSERT INTO public.profiles (id, name, email, role, school_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    school_id_val
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    school_id = COALESCE(EXCLUDED.school_id, public.profiles.school_id),
    updated_at = now();

  -- 3. Automatically link to Student/Teacher tables if email matches
  -- This ensures the 'Key' icon disappears and they are linked
  UPDATE public.students 
  SET user_id = new.id 
  WHERE email = new.email AND user_id IS NULL;

  UPDATE public.teachers 
  SET user_id = new.id 
  WHERE email = new.email AND user_id IS NULL;

  RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
