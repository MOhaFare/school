-- Fix "Function Search Path Mutable" Security Advisories
-- We must explicitly set search_path for SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION public.get_auth_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'system_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  my_school_id UUID;
BEGIN
  SELECT school_id INTO my_school_id
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN my_school_id;
END;
$$;

-- Ensure get_school_stats is also secure if it exists
CREATE OR REPLACE FUNCTION public.get_school_stats()
RETURNS TABLE (
  school_name TEXT,
  role TEXT,
  user_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT 
    s.name as school_name,
    p.role,
    COUNT(p.id) as user_count
  FROM profiles p
  JOIN schools s ON p.school_id = s.id
  GROUP BY s.name, p.role
  ORDER BY s.name, p.role;
$$;

-- Grant permissions explicitly to authenticated users
GRANT EXECUTE ON FUNCTION public.get_auth_school_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_system_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_school_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_school_stats TO authenticated;
