/*
# [Function Security Hardening]
This script hardens the security of database functions by explicitly setting the `search_path`.

## Query Description:
- This operation modifies the `handle_new_user` function.
- It sets the `search_path` to `public`, which prevents malicious users from creating objects (e.g., tables or functions) in other schemas that could be executed unintentionally.
- This is a preventative security measure and has no impact on existing data.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Function affected: `handle_new_user()`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Admin privileges to alter functions.
- Mitigates: Potential for search path hijacking attacks.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. This is a security setting, not a performance-related change.
*/

ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
