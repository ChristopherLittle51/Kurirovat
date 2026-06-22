create table if not exists public.generation_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  status text not null default 'queued',
  stage text not null default 'Queued',
  progress integer not null default 0,
  request_payload jsonb not null default '{}'::jsonb,
  result_application_id uuid references public.applications on delete set null,
  error_message text,
  attempt_count integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  constraint generation_jobs_status_check check (status in ('queued', 'running', 'succeeded', 'failed')),
  constraint generation_jobs_progress_check check (progress >= 0 and progress <= 100)
);

alter table public.generation_jobs enable row level security;

create policy "Users can view their own generation jobs" on public.generation_jobs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own generation jobs" on public.generation_jobs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own generation jobs" on public.generation_jobs
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists generation_jobs_user_created_idx
  on public.generation_jobs (user_id, created_at desc);

create index if not exists generation_jobs_status_updated_idx
  on public.generation_jobs (status, updated_at);

grant select, insert, update on public.generation_jobs to authenticated;
