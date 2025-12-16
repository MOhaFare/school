-- 1. Fix "Function Search Path Mutable" Warnings
-- We explicitly set the search_path for all security-critical functions
ALTER FUNCTION get_auth_school_id() SET search_path = public;
ALTER FUNCTION is_system_admin() SET search_path = public;
ALTER FUNCTION set_school_id() SET search_path = public;

-- Fix the user creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Fixes the warning
AS $$
DECLARE
  target_school_id UUID;
BEGIN
  -- Extract school_id from metadata
  target_school_id := (new.raw_user_meta_data->>'school_id')::uuid;

  -- Insert into profiles
  INSERT INTO public.profiles (id, name, email, role, school_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    target_school_id
  );
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth sign up
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$;

-- Fix the unlinked users function
CREATE OR REPLACE FUNCTION get_unlinked_users(role_name text)
RETURNS TABLE (
  id uuid,
  email text
) 
SECURITY DEFINER
SET search_path = public -- Fixes the warning
LANGUAGE plpgsql
AS $$
DECLARE
  auth_school_id UUID;
BEGIN
  -- Get current user's school
  SELECT school_id INTO auth_school_id
  FROM profiles
  WHERE profiles.id = auth.uid();

  -- Return users who match the role, belong to the same school, and are NOT linked
  RETURN QUERY
  SELECT au.id, au.email::text
  FROM auth.users au
  JOIN public.profiles pp ON au.id = pp.id
  WHERE pp.role = role_name
  AND pp.school_id = auth_school_id -- Strict isolation
  AND NOT EXISTS (
    SELECT 1 FROM public.students s WHERE s.user_id = au.id
    UNION ALL
    SELECT 1 FROM public.teachers t WHERE t.user_id = au.id
  );
END;
$$;

-- 2. Fix "Security Definer View" Error
-- Instead of a view, we use a secure function for the dashboard stats
DROP VIEW IF EXISTS school_stats_view;

CREATE OR REPLACE FUNCTION get_school_stats()
RETURNS TABLE (
  school_name text,
  role text,
  user_count bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow system admins to run this
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'system_admin'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    s.name::text as school_name,
    p.role::text,
    count(p.id) as user_count
  FROM profiles p
  JOIN schools s ON p.school_id = s.id
  GROUP BY s.name, p.role
  ORDER BY s.name;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION get_school_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_unlinked_users TO authenticated;
