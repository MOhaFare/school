/*
  # [Structural] Create Notifications Table
  [This script creates a new table `notifications` to store user-specific alerts and messages. It also enables Row Level Security and defines policies to ensure users can only access and manage their own notifications.]

  ## Query Description: [This operation adds a new `notifications` table for managing user alerts. It is a non-destructive, structural change and will not impact existing data. It includes security policies to enforce data privacy.]

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: `public.notifications`
  - Columns: `id`, `created_at`, `user_id`, `title`, `message`, `is_read`, `link`, `type`

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes
  - Auth Requirements: Users must be authenticated. Policies restrict access to a user's own notifications.
  
  ## Performance Impact:
  - Indexes: A foreign key index on `user_id` will be created automatically, which is good for performance when fetching notifications for a specific user.
  - Triggers: None
  - Estimated Impact: Low.
*/

-- 1. Create the notifications table
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    link text NULL,
    type text NULL,
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
CREATE POLICY "Enable read access for own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable update for own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Note: INSERT operations are expected to be handled by trusted roles or triggers,
-- so no general INSERT policy is created for users.
