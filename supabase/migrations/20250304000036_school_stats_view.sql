-- Create a view to easily query user distribution per school
-- This helps System Admins verify that roles are correctly assigned to schools
CREATE OR REPLACE VIEW school_user_stats AS
SELECT 
  s.id as school_id,
  s.name as school_name,
  p.role,
  COUNT(*) as user_count
FROM schools s
JOIN profiles p ON s.id = p.school_id
GROUP BY s.id, s.name, p.role
ORDER BY s.name, p.role;

-- Grant access to authenticated users (RLS will filter this, but for system_admin we want full access)
-- Since it's a view, we rely on the underlying table policies, but for system admin dashboard we need a direct read.
-- We'll create a secure function to read this view bypassing RLS for the dashboard widget.

CREATE OR REPLACE FUNCTION get_school_stats()
RETURNS TABLE (
  school_name text,
  role text,
  user_count bigint
) 
SECURITY DEFINER -- Runs with owner privileges to see all stats
SET search_path = public
LANGUAGE sql
AS $$
  SELECT 
    s.name as school_name,
    p.role::text,
    COUNT(*) as user_count
  FROM schools s
  JOIN profiles p ON s.id = p.school_id
  -- Only return data if the requester is a system_admin
  WHERE EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'system_admin'
  )
  GROUP BY s.name, p.role
  ORDER BY s.name, p.role;
$$;
