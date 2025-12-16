-- 1. Secure get_unlinked_users RPC
-- This function is critical for the "Link User" dropdown.
-- It filters users to ensure admins ONLY see users from their own school.
CREATE OR REPLACE FUNCTION get_unlinked_users(role_name text)
RETURNS TABLE (id uuid, email text)
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_school_id uuid;
  current_user_role text;
BEGIN
  -- Get current user context
  SELECT school_id, role INTO current_school_id, current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN QUERY
  SELECT p.id, p.email::text
  FROM public.profiles p
  WHERE 
    p.role = role_name -- Match requested role (student/teacher)
    AND (
      -- Visibility check:
      -- 1. System Admin sees all
      current_user_role = 'system_admin'
      OR
      -- 2. School Admin/User sees only their school's users
      p.school_id = current_school_id
    )
    -- Exclude users already linked to a Student record
    AND NOT EXISTS (
      SELECT 1 
      FROM public.students s 
      WHERE s.user_id = p.id
    )
    -- Exclude users already linked to a Teacher record
    AND NOT EXISTS (
      SELECT 1 
      FROM public.teachers t 
      WHERE t.user_id = p.id
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Enforce Strict RLS on Profiles
-- Ensure users can't query profiles from other schools via API
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles viewable by same school" ON profiles;

CREATE POLICY "Profiles viewable by same school" ON profiles
FOR SELECT USING (
  (select role from profiles where id = auth.uid()) = 'system_admin' -- Super admin sees all
  OR
  school_id = (select school_id from profiles where id = auth.uid()) -- Users see their school's profiles
  OR
  id = auth.uid() -- Users can always see themselves
);

-- 3. Ensure Schools table visibility
-- School Admins need to see their own school details (for logo/name)
DROP POLICY IF EXISTS "Schools viewable by system admin or own school" ON schools;

CREATE POLICY "Schools viewable by system admin or own school" ON schools
FOR SELECT USING (
  (select role from profiles where id = auth.uid()) = 'system_admin'
  OR
  id = (select school_id from profiles where id = auth.uid())
);
