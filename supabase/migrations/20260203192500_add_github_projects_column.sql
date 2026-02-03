alter table public.profiles
add column if not exists github_projects jsonb default '[]'::jsonb;

alter table public.applications
add column if not exists github_projects jsonb default '[]'::jsonb;
