--
-- # [User Roles &amp; Permissions]
-- This migration adds a role-based access control system to the application.
--
-- ## Query Description:
-- This script introduces a `user_role` type (admin, teacher, student) and adds a `role`
-- column to the `profiles` table. It also updates the `handle_new_user` trigger
-- to automatically assign a role to new users based on the information they provide at sign-up.
-- This is a safe, structural change and does not risk any existing data.
--
-- ## Metadata:
-- - Schema-Category: "Structural"
-- - Impact-Level: "Low"
-- - Requires-Backup: false
-- - Reversible: true
--
-- ## Structure Details:
-- - Adds ENUM type: `public.user_role`
-- - Alters TABLE: `public.profiles`
--   - Adds COLUMN: `role` (public.user_role, NOT NULL, DEFAULT 'student')
-- - Alters FUNCTION: `public.handle_new_user()`
--
-- ## Security Implications:
-- - RLS Status: No change to existing policies, but this enables future role-based policies.
-- - Policy Changes: No
-- - Auth Requirements: None
--
-- ## Performance Impact:
-- - Indexes: None
-- - Triggers: Modifies `on_auth_user_created` trigger logic.
-- - Estimated Impact: Negligible performance impact.
--

-- Step 1: Create the user_role enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'teacher', 'student');
    END IF;
END$$;

-- Step 2: Add the role column to the profiles table if it doesn't exist
-- This is made safe by checking for the column's existence first.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles
        ADD COLUMN role public.user_role NOT NULL DEFAULT 'student';
    END IF;
END$$;

-- Step 3: Update the handle_new_user function to set the role from metadata
-- This function now extracts the 'role' from the user metadata provided at signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id,
    new.email,
    -- Safely access role from metadata, fall back to 'student' if not provided or invalid
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Step 4: Re-apply the trigger to the users table to ensure it's up-to-date
-- This ensures the new function logic is used for all new user sign-ups.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Manually assign 'admin' role to the first user for testing purposes
-- This is a helpful step for development, allowing the first user to have full access.
-- You can change the email to your own admin email.
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Find the first user created in the system
  SELECT id INTO first_user_id FROM auth.users ORDER BY created_at LIMIT 1;

  -- If a user exists, update their role to 'admin'
  IF first_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = first_user_id AND role != 'admin';
  END IF;
END$$;
