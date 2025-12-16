-- 1. Drop the insecure view (Critical Fix)
-- We now use the function 'get_school_stats' instead, so this view is obsolete and risky.
DROP VIEW IF EXISTS school_stats_view;

-- 2. Explicitly secure critical functions (Warning Fixes)
-- Setting search_path = public prevents schema hijacking
ALTER FUNCTION get_auth_school_id() SET search_path = public;
ALTER FUNCTION is_system_admin() SET search_path = public;
ALTER FUNCTION get_school_stats() SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public;

-- 3. Dynamic sweep to secure ANY other public functions
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        -- Filter out internal postgres functions just in case
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT LIKE 'uuid_%'
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', func_record.function_name, func_record.args);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors for functions we can't modify (like extensions)
            RAISE NOTICE 'Skipping function %: %', func_record.function_name, SQLERRM;
        END;
    END LOOP;
END $$;
