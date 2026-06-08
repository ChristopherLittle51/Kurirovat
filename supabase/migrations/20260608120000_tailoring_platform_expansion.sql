alter table profiles
  add column if not exists achievement_bank jsonb default '[]'::jsonb,
  add column if not exists tailoring_playbooks jsonb default '[]'::jsonb,
  add column if not exists imported_profile_sources jsonb default '[]'::jsonb,
  add column if not exists target_roles text[] default '{}'::text[],
  add column if not exists preferred_industries text[] default '{}'::text[],
  add column if not exists target_regions jsonb default '[]'::jsonb,
  add column if not exists anti_claims text[] default '{}'::text[],
  add column if not exists learned_preference_suggestions jsonb default '[]'::jsonb;

alter table applications
  add column if not exists job_analysis jsonb default '{}'::jsonb,
  add column if not exists evidence_resolution jsonb default '{}'::jsonb,
  add column if not exists diagnostics jsonb default '{}'::jsonb,
  add column if not exists rewrite_insights jsonb default '{}'::jsonb,
  add column if not exists prompt_preview text,
  add column if not exists selected_playbook_id text,
  add column if not exists generation_options jsonb default '{}'::jsonb,
  add column if not exists edit_suggestions jsonb default '[]'::jsonb,
  add column if not exists regeneration_history jsonb default '[]'::jsonb,
  add column if not exists profile_photo_url text,
  add column if not exists github_last_synced_at timestamp with time zone;

create table if not exists lead_sources (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  label text not null,
  url text not null,
  source_type text not null default 'other',
  regions jsonb default '[]'::jsonb,
  notes text,
  last_checked_at timestamp with time zone
);

alter table lead_sources enable row level security;

create policy "Users can view their own lead sources" on lead_sources
  for select using (auth.uid() = user_id);

create policy "Users can insert their own lead sources" on lead_sources
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own lead sources" on lead_sources
  for update using (auth.uid() = user_id);

create policy "Users can delete their own lead sources" on lead_sources
  for delete using (auth.uid() = user_id);

create table if not exists lead_source_checks (
  id uuid default gen_random_uuid() primary key,
  lead_source_id uuid references lead_sources on delete cascade not null,
  checked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null default 'pending',
  notes text,
  discovered_count integer default 0
);

alter table lead_source_checks enable row level security;

create policy "Users can view checks for their lead sources" on lead_source_checks
  for select using (
    exists (
      select 1 from lead_sources
      where lead_sources.id = lead_source_checks.lead_source_id
      and lead_sources.user_id = auth.uid()
    )
  );

create policy "Users can insert checks for their lead sources" on lead_source_checks
  for insert with check (
    exists (
      select 1 from lead_sources
      where lead_sources.id = lead_source_checks.lead_source_id
      and lead_sources.user_id = auth.uid()
    )
  );

create table if not exists job_leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  lead_source_id uuid references lead_sources on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  company_name text not null,
  location text,
  url text not null,
  summary text,
  raw_description text,
  provenance jsonb default '{}'::jsonb,
  regions jsonb default '[]'::jsonb,
  match jsonb default '{}'::jsonb,
  status text default 'new'
);

alter table job_leads enable row level security;

create policy "Users can view their own job leads" on job_leads
  for select using (auth.uid() = user_id);

create policy "Users can insert their own job leads" on job_leads
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own job leads" on job_leads
  for update using (auth.uid() = user_id);

create policy "Users can delete their own job leads" on job_leads
  for delete using (auth.uid() = user_id);
