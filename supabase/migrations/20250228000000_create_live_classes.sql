create table if not exists public.live_classes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  class text not null,
  section text not null,
  subject text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  meeting_url text,
  teacher_id uuid references public.teachers(id)
);

-- RLS Policies
alter table public.live_classes enable row level security;

create policy "Enable read access for all authenticated users"
on public.live_classes for select
to authenticated
using (true);

create policy "Enable insert for teachers and admins"
on public.live_classes for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'teacher' or profiles.role = 'system_admin')
  )
);

create policy "Enable delete for teachers and admins"
on public.live_classes for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'teacher' or profiles.role = 'system_admin')
  )
);
