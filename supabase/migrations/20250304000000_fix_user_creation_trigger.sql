/*
  # Fix User Creation Trigger
  
  ## Query Description:
  This migration updates the `handle_new_user` trigger function to be more robust.
  It handles cases where metadata might be missing or null, ensuring that the
  profile creation doesn't fail and roll back the user creation.
  
  ## Metadata:
  - Schema-Category: Safe
  - Impact-Level: Medium
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Replaces function `public.handle_new_user()`
  - Re-creates trigger `on_auth_user_created`
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role text;
  meta_full_name text;
  meta_school_id uuid;
  existing_profile_id uuid;
BEGIN
  -- Extract metadata with fallbacks
  meta_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  meta_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.email);
  
  -- Handle school_id safely (cast text to uuid if present and valid)
  BEGIN
    IF new.raw_user_meta_data->>'school_id' IS NOT NULL AND new.raw_user_meta_data->>'school_id' != '' THEN
      meta_school_id := (new.raw_user_meta_data->>'school_id')::uuid;
    ELSE
      meta_school_id := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If casting fails, default to NULL rather than crashing the transaction
    meta_school_id := NULL;
  END;

  -- Check if profile already exists to avoid unique constraint violations
  SELECT id INTO existing_profile_id FROM public.profiles WHERE id = new.id;

  IF existing_profile_id IS NULL THEN
    INSERT INTO public.profiles (id, email, name, role, school_id)
    VALUES (
      new.id,
      new.email,
      meta_full_name,
      meta_role,
      meta_school_id
    );
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but allow user creation to proceed (profile can be fixed later if needed)
  -- This prevents "Database error creating new user" from blocking signups
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN new;
END;
$$;

-- Ensure the trigger is properly set
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
