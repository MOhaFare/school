-- Migration: Optimized User Trigger and Backfill (Fixes Timeout)
-- Timestamp: 20250304000003

-- 1. Drop existing trigger to ensure we can replace the function cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create or Replace the robust function (Handles missing data gracefully)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  extracted_school_id UUID;
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Safe extraction of school_id with error handling for invalid UUIDs
  BEGIN
    IF new.raw_user_meta_data->>'school_id' IS NOT NULL AND new.raw_user_meta_data->>'school_id' != '' THEN
      extracted_school_id := (new.raw_user_meta_data->>'school_id')::UUID;
    ELSE
      extracted_school_id := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If casting fails, default to NULL rather than failing the transaction
    extracted_school_id := NULL;
  END;

  -- Default role to student if missing
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  
  -- Default name to email if missing
  user_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email);

  -- Insert or Update Profile
  INSERT INTO public.profiles (id, name, email, role, school_id, created_at, updated_at)
  VALUES (
    new.id,
    user_name,
    new.email,
    user_role,
    extracted_school_id,
    new.created_at,
    new.created_at
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    school_id = COALESCE(EXCLUDED.school_id, public.profiles.school_id),
    updated_at = NOW();

  RETURN new;
END;
$$;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Optimized Bulk Backfill (Set-based operation is much faster than loops)
-- This fixes the "Connection Timeout" issue by doing it in one efficient query
INSERT INTO public.profiles (id, name, email, role, school_id, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email) as name,
  email,
  COALESCE(raw_user_meta_data->>'role', 'student') as role,
  CASE 
      WHEN raw_user_meta_data->>'school_id' IS NOT NULL AND raw_user_meta_data->>'school_id' != '' 
      THEN (raw_user_meta_data->>'school_id')::uuid 
      ELSE NULL 
  END as school_id,
  created_at,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
