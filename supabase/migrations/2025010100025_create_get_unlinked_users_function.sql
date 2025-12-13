CREATE OR REPLACE FUNCTION public.get_unlinked_users(role_name public.user_role)
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
/*
    # [Function] Get Unlinked Users
    This function retrieves users of a specific role ('student' or 'teacher') who are not yet linked to a corresponding student or teacher profile.

    ## Query Description:
    - Safely queries the `auth.users` and `public.profiles` tables.
    - Filters users by the provided role.
    - Excludes users who already have their `user_id` present in the `students` or `teachers` table.
    - Returns a list of user IDs and emails, which is safe to display in the UI.
    - This operation is read-only and does not modify any data.

    ## Metadata:
    - Schema-Category: ["Safe", "Structural"]
    - Impact-Level: ["Low"]
    - Requires-Backup: false
    - Reversible: true (The function can be dropped)

    ## Structure Details:
    - Reads from: `auth.users`, `public.profiles`, `public.students`, `public.teachers`
    - Creates function: `public.get_unlinked_users`

    ## Security Implications:
    - RLS Status: Not applicable to functions directly, but it respects RLS on tables it queries when not using SECURITY DEFINER.
    - Policy Changes: No
    - Auth Requirements: Uses `SECURITY DEFINER` to safely access `auth.users`. The logic is constrained to only return non-sensitive data for specific roles.

    ## Performance Impact:
    - Indexes: Relies on existing primary key indexes.
    - Triggers: None
    - Estimated Impact: Low. The query is efficient and will only be called by administrators on specific forms.
*/
BEGIN
    IF role_name = 'student' THEN
        RETURN QUERY
        SELECT u.id, u.email
        FROM auth.users u
        JOIN public.profiles p ON u.id = p.id
        WHERE p.role = 'student'
          AND u.id NOT IN (SELECT s.user_id FROM public.students s WHERE s.user_id IS NOT NULL);
    ELSIF role_name = 'teacher' THEN
        RETURN QUERY
        SELECT u.id, u.email
        FROM auth.users u
        JOIN public.profiles p ON u.id = p.id
        WHERE p.role = 'teacher'
          AND u.id NOT IN (SELECT t.user_id FROM public.teachers t WHERE t.user_id IS NOT NULL);
    END IF;
END;
$$;
