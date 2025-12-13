-- Fixes the get_unlinked_users function by casting the email column to text.
-- This resolves the "structure of query does not match function result type" error.

CREATE OR REPLACE FUNCTION public.get_unlinked_users(role_name public.user_role)
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF role_name = 'student' THEN
        RETURN QUERY
        SELECT u.id, u.email::text
        FROM auth.users u
        LEFT JOIN public.students s ON u.id = s.user_id
        WHERE s.id IS NULL AND u.raw_user_meta_data->>'role' = 'student';
    ELSIF role_name = 'teacher' THEN
        RETURN QUERY
        SELECT u.id, u.email::text
        FROM auth.users u
        LEFT JOIN public.teachers t ON u.id = t.user_id
        WHERE t.id IS NULL AND u.raw_user_meta_data->>'role' = 'teacher';
    END IF;
END;
$$;
