-- Drop the insecure view that is flagging the security advisory
-- We have already replaced its functionality with the secure 'get_school_stats' function
DROP VIEW IF EXISTS school_stats_view;

-- Ensure no other potential insecure views exist from previous attempts
DROP VIEW IF EXISTS admin_stats_view;
DROP VIEW IF EXISTS system_overview_view;

-- Double check search_path on the replacement function to be safe
ALTER FUNCTION get_school_stats() SET search_path = public;
