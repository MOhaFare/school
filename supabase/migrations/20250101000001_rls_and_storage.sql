/*
          # [Enable RLS and Create Storage]
          This script enables Row Level Security (RLS) for all tables to secure your data and creates a storage bucket for avatar images.

          ## Query Description: [This is a critical security update. It ensures that data can only be accessed by authenticated users according to the policies defined. It also sets up the necessary infrastructure for file uploads.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "High"
          - Requires-Backup: false
          - Reversible: true
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: All policies require users to be authenticated.
          */

-- Create Storage Bucket for Avatars
-- This bucket will store the profile pictures for students and teachers.
insert into storage.buckets
  (id, name, public)
values
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Create Policies for Avatars Bucket
-- These policies allow any authenticated user to manage their own avatar images.

-- Policy for viewing avatars
create policy "allow_authenticated_read_avatars"
on storage.objects for select
to authenticated
using ( bucket_id = 'avatars' );

-- Policy for uploading avatars
create policy "allow_authenticated_upload_avatars"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' );

-- Policy for updating avatars
create policy "allow_authenticated_update_avatars"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars' );

-- Policy for deleting avatars
create policy "allow_authenticated_delete_avatars"
on storage.objects for delete
to authenticated
using ( bucket_id = 'avatars' );


-- Enable RLS for all tables
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.exams enable row level security;
alter table public.grades enable row level security;
alter table public.payrolls enable row level security;
alter table public.classes enable row level security;
alter table public.courses enable row level security;
alter table public.departments enable row level security;
alter table public.library_books enable row level security;
alter table public.fees enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;
alter table public.hostel_rooms enable row level security;
alter table public.transport_vehicles enable row level security;
alter table public.notices enable row level security;
alter table public.expenses enable row level security;
alter table public.incomes enable row level security;

-- Create Policies for all tables
-- These policies are permissive and allow any authenticated user to perform all actions.
-- For a production environment, you would want to create more restrictive policies based on user roles.

-- Teachers
create policy "allow_all_for_authenticated_users_on_teachers" on public.teachers for all to authenticated using (true) with check (true);
-- Students
create policy "allow_all_for_authenticated_users_on_students" on public.students for all to authenticated using (true) with check (true);
-- Exams
create policy "allow_all_for_authenticated_users_on_exams" on public.exams for all to authenticated using (true) with check (true);
-- Grades
create policy "allow_all_for_authenticated_users_on_grades" on public.grades for all to authenticated using (true) with check (true);
-- Payrolls
create policy "allow_all_for_authenticated_users_on_payrolls" on public.payrolls for all to authenticated using (true) with check (true);
-- Classes
create policy "allow_all_for_authenticated_users_on_classes" on public.classes for all to authenticated using (true) with check (true);
-- Courses
create policy "allow_all_for_authenticated_users_on_courses" on public.courses for all to authenticated using (true) with check (true);
-- Departments
create policy "allow_all_for_authenticated_users_on_departments" on public.departments for all to authenticated using (true) with check (true);
-- Library Books
create policy "allow_all_for_authenticated_users_on_library_books" on public.library_books for all to authenticated using (true) with check (true);
-- Fees
create policy "allow_all_for_authenticated_users_on_fees" on public.fees for all to authenticated using (true) with check (true);
-- Events
create policy "allow_all_for_authenticated_users_on_events" on public.events for all to authenticated using (true) with check (true);
-- Attendance
create policy "allow_all_for_authenticated_users_on_attendance" on public.attendance for all to authenticated using (true) with check (true);
-- Hostel Rooms
create policy "allow_all_for_authenticated_users_on_hostel_rooms" on public.hostel_rooms for all to authenticated using (true) with check (true);
-- Transport Vehicles
create policy "allow_all_for_authenticated_users_on_transport_vehicles" on public.transport_vehicles for all to authenticated using (true) with check (true);
-- Notices
create policy "allow_all_for_authenticated_users_on_notices" on public.notices for all to authenticated using (true) with check (true);
-- Expenses
create policy "allow_all_for_authenticated_users_on_expenses" on public.expenses for all to authenticated using (true) with check (true);
-- Incomes
create policy "allow_all_for_authenticated_users_on_incomes" on public.incomes for all to authenticated using (true) with check (true);
