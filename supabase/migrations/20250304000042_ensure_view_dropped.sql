-- Force drop the insecure view with CASCADE to remove any dependencies
DROP VIEW IF EXISTS school_stats_view CASCADE;

-- Ensure the replacement function is secure
ALTER FUNCTION get_school_stats() SET search_path = public;
