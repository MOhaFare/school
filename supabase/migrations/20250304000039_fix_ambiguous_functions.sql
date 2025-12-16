-- Fix ambiguous function error by dropping all variations of get_unlinked_users first
DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT oid::regprocedure::text as signature 
        FROM pg_proc 
        WHERE proname = 'get_unlinked_users'
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_record.signature || ' CASCADE';
    END LOOP;
END $$;

-- Recreate the function securely with the correct signature
CREATE OR REPLACE FUNCTION get_unlinked_users(role_name text)
RETURNS TABLE (
  id uuid,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_school_id uuid;
BEGIN
  -- Get the current user's school_id safely using the helper function
  -- (Assumes get_auth_school_id exists from previous migrations)
  current_school_id := get_auth_school_id();

  RETURN QUERY
  SELECT 
    p.id, 
    p.email::text
  FROM profiles p
  WHERE p.role = role_name
  AND p.school_id = current_school_id
  AND (
    -- If looking for students, ensure they aren't already linked in students table
    (role_name = 'student' AND NOT EXISTS (
      SELECT 1 FROM students s WHERE s.user_id = p.id
    ))
    OR
    -- If looking for teachers, ensure they aren't already linked in teachers table
    (role_name = 'teacher' AND NOT EXISTS (
      SELECT 1 FROM teachers t WHERE t.user_id = p.id
    ))
  );
END;
$$;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unlinked_users(text) TO authenticated;
