/*
# [Operation Name]
Secure All User-Defined Functions

## Query Description:
This script iterates through all functions in the 'public' schema and sets their `search_path`. This is a security best practice that mitigates the risk of search path hijacking attacks by ensuring functions resolve objects from expected schemas. This addresses the "Function Search Path Mutable" security warning. This operation is safe and does not affect existing data.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by manually altering the functions back)

## Structure Details:
- Affects all functions in the `public` schema.

## Security Implications:
- RLS Status: Not Affected
- Policy Changes: No
- Auth Requirements: Admin privileges to run ALTER FUNCTION.
- Mitigates: Search path hijacking vulnerabilities.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

DO $$
DECLARE
    function_record RECORD;
BEGIN
    FOR function_record IN
        SELECT
            p.proname AS function_name,
            n.nspname AS schema_name,
            pg_get_function_identity_arguments(p.oid) AS function_args
        FROM
            pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE
            n.nspname = 'public' -- Only target functions in the public schema
            AND p.proname NOT IN ('get_unlinked_users', 'handle_new_user') -- Exclude functions that were replaced or are known to be safe
    LOOP
        -- Using format() to safely construct the dynamic SQL
        EXECUTE format(
            'ALTER FUNCTION %I.%I(%s) SET search_path = "$user", public, extensions;',
            function_record.schema_name,
            function_record.function_name,
            function_record.function_args
        );
    END LOOP;

    -- Specifically secure the main function we use
    ALTER FUNCTION public.create_user_profile_and_link(full_name text, role public.user_role, class text, section text, subject text)
    SET search_path = "$user", public, extensions;

END $$;
