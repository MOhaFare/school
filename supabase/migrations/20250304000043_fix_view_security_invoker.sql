-- Universal Security Fix for Views
-- This script finds ALL views in the public schema and sets security_invoker = true
-- This satisfies the "Security Definer View" warning by ensuring views run with the permissions of the caller, not the owner.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Explicitly drop the problematic view if it still exists (just to be sure)
    DROP VIEW IF EXISTS public.school_stats_view CASCADE;

    -- 2. Loop through ANY remaining views in the public schema
    FOR r IN (
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewowner = current_user -- Only modify views owned by the current user (postgres/supabase_admin)
    ) LOOP
        -- Set security_invoker = true for each view
        EXECUTE 'ALTER VIEW public.' || quote_ident(r.viewname) || ' SET (security_invoker = true)';
        RAISE NOTICE 'Secured view: %', r.viewname;
    END LOOP;
END $$;
