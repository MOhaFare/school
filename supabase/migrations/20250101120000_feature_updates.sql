/*
          # [Feature Update] Add Capacity to Classes and Month to Fees
          This migration adds a 'capacity' column to the 'classes' table to limit student enrollment and a 'month' column to the 'fees' table to support monthly billing.

          ## Query Description: 
          - Adds a 'capacity' column to the 'classes' table with a default value of 40. This is a non-destructive change but will be used to enforce enrollment limits.
          - Adds a 'month' column to the 'fees' table. This is also non-destructive and will allow for tracking fees on a monthly basis.
          - No existing data will be lost.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table 'classes': ADD COLUMN 'capacity' INT
          - Table 'fees': ADD COLUMN 'month' TEXT
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. These are simple column additions with default values.
          */

ALTER TABLE public.classes
ADD COLUMN capacity INT NOT NULL DEFAULT 40;

ALTER TABLE public.fees
ADD COLUMN month TEXT;
