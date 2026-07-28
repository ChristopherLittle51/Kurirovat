-- Tailoring v2: durable candidate evidence, resumable generation, and application outcomes.

create table if not exists public.candidate_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id text,
  title text not null default '',
  situation text not null default '',
  action text not null default '',
  result text not null default '',
  metric text not null default '',
  scope text not null default '',
  tools text[] not null default '{}',
  team_size text not null default '',
  domain text not null default '',
  tags text[] not null default '{}',
  source_type text not null default 'manual',
  source_label text not null default '',
  source_excerpt text not null default '',
  confidence text not null default 'medium'
    check (confidence in ('high', 'medium', 'low')),
  role_ids text[] not null default '{}',
  must_include boolean not null default false,
  nice_to_use boolean not null default true,
  unavailable boolean not null default false,
  disabled boolean not null default false,
  role_family_constraints text[] not null default '{}',
  dedupe_key text not null default '',
  last_used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, legacy_id)
);

alter table public.candidate_evidence enable row level security;

create policy "Users can view their own candidate evidence"
  on public.candidate_evidence for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own candidate evidence"
  on public.candidate_evidence for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own candidate evidence"
  on public.candidate_evidence for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own candidate evidence"
  on public.candidate_evidence for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists candidate_evidence_user_updated_idx
  on public.candidate_evidence (user_id, updated_at desc);

create index if not exists candidate_evidence_user_dedupe_idx
  on public.candidate_evidence (user_id, dedupe_key)
  where dedupe_key <> '';

create table if not exists public.candidate_evidence_usage (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.candidate_evidence(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  generation_job_id uuid references public.generation_jobs(id) on delete set null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  used_at timestamptz not null default timezone('utc', now()),
  locations text[] not null default '{}',
  unique (evidence_id, generation_job_id)
);

alter table public.candidate_evidence_usage enable row level security;

create policy "Users can view their own evidence usage"
  on public.candidate_evidence_usage for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own evidence usage"
  on public.candidate_evidence_usage for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Preserve the prior JSON achievement bank while normalizing it into owner-only rows.
insert into public.candidate_evidence (
  id,
  user_id,
  legacy_id,
  title,
  situation,
  action,
  result,
  metric,
  scope,
  tools,
  team_size,
  domain,
  tags,
  source_type,
  confidence,
  role_ids,
  must_include,
  nice_to_use,
  unavailable,
  disabled,
  role_family_constraints,
  dedupe_key
)
select
  case
    when coalesce(entry->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then (entry->>'id')::uuid
    else gen_random_uuid()
  end,
  profiles.id,
  nullif(entry->>'id', ''),
  coalesce(entry->>'title', ''),
  coalesce(entry->>'situation', ''),
  coalesce(entry->>'action', ''),
  coalesce(entry->>'result', ''),
  coalesce(entry->>'metric', ''),
  coalesce(entry->>'scope', ''),
  coalesce(array(select jsonb_array_elements_text(coalesce(entry->'tools', '[]'::jsonb))), '{}'),
  coalesce(entry->>'teamSize', ''),
  coalesce(entry->>'domain', ''),
  coalesce(array(select jsonb_array_elements_text(coalesce(entry->'tags', '[]'::jsonb))), '{}'),
  coalesce(entry->>'sourceType', 'manual'),
  case
    when entry->>'confidence' in ('high', 'medium', 'low') then entry->>'confidence'
    else 'medium'
  end,
  coalesce(array(select jsonb_array_elements_text(coalesce(entry->'roleIds', '[]'::jsonb))), '{}'),
  coalesce((entry->>'mustInclude')::boolean, false),
  coalesce((entry->>'niceToUse')::boolean, true),
  coalesce((entry->>'neverUse')::boolean, false)
    or coalesce(entry->>'sourceType', '') in ('job_description', 'company_research'),
  coalesce((entry->>'neverUse')::boolean, false)
    or coalesce(entry->>'sourceType', '') in ('job_description', 'company_research'),
  coalesce(array(select jsonb_array_elements_text(coalesce(entry->'roleFamilyConstraints', '[]'::jsonb))), '{}'),
  lower(regexp_replace(
    concat_ws(' ', entry->>'title', entry->>'action', entry->>'result', entry->>'metric'),
    '[^a-zA-Z0-9]+',
    ' ',
    'g'
  ))
from public.profiles
cross join lateral jsonb_array_elements(coalesce(profiles.achievement_bank, '[]'::jsonb)) entry
on conflict (user_id, legacy_id) do nothing;

-- Make the source resume usable as baseline evidence even when the legacy
-- achievement bank is empty. These rows preserve wording and carry no invented
-- metric decomposition; later STAR interviews can add richer records.
insert into public.candidate_evidence (
  user_id,
  legacy_id,
  title,
  situation,
  action,
  source_type,
  source_label,
  source_excerpt,
  confidence,
  role_ids,
  nice_to_use,
  dedupe_key
)
select
  profiles.id,
  concat('resume:', coalesce(role->>'id', role_index::text), ':', bullet_index::text),
  concat_ws(' - ', nullif(role->>'company', ''), nullif(role->>'role', '')),
  concat_ws(' ', nullif(role->>'role', ''), case when coalesce(role->>'company', '') <> '' then concat('at ', role->>'company') end),
  bullet,
  'resume',
  concat_ws(' - ', nullif(role->>'company', ''), nullif(role->>'role', '')),
  bullet,
  'medium',
  case when coalesce(role->>'id', '') <> '' then array[role->>'id'] else '{}'::text[] end,
  true,
  lower(regexp_replace(bullet, '[^a-zA-Z0-9]+', ' ', 'g'))
from public.profiles
cross join lateral jsonb_array_elements(coalesce(profiles.experience, '[]'::jsonb))
  with ordinality as roles(role, role_index)
cross join lateral jsonb_array_elements_text(coalesce(role->'description', '[]'::jsonb))
  with ordinality as bullets(bullet, bullet_index)
where btrim(bullet) <> ''
on conflict (user_id, legacy_id) do nothing;

create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'created',
    'applied',
    'reply_received',
    'screening',
    'interview_scheduled',
    'interview_completed',
    'rejected',
    'offer',
    'withdrawn',
    'no_response',
    'legacy_status_imported'
  )),
  occurred_at timestamptz,
  recorded_at timestamptz not null default timezone('utc', now()),
  notes text not null default '',
  interview_round integer check (interview_round is null or interview_round > 0),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.application_events enable row level security;

create policy "Users can view their own application events"
  on public.application_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own application events"
  on public.application_events for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.applications
      where applications.id = application_events.application_id
        and applications.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own application events"
  on public.application_events for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own application events"
  on public.application_events for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists application_events_application_time_idx
  on public.application_events (application_id, occurred_at asc nulls last, recorded_at asc);

create or replace function public.sync_application_status_from_event()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.applications
  set status = case new.event_type
    when 'applied' then 'Sent'::application_status
    when 'reply_received' then 'Replied'::application_status
    when 'screening' then 'Replied'::application_status
    when 'interview_scheduled' then 'Interview Scheduled'::application_status
    when 'interview_completed' then 'Interview Scheduled'::application_status
    when 'rejected' then 'Rejected'::application_status
    when 'no_response' then 'Rejected'::application_status
    when 'legacy_status_imported' then case new.metadata->>'status'
      when 'Pending' then 'Pending'::application_status
      when 'Sent' then 'Sent'::application_status
      when 'Replied' then 'Replied'::application_status
      when 'Interview Scheduled' then 'Interview Scheduled'::application_status
      when 'Rejected' then 'Rejected'::application_status
      else status
    end
    else status
  end
  where id = new.application_id
    and user_id = new.user_id;
  return new;
end;
$$;

revoke all on function public.sync_application_status_from_event() from public;
grant execute on function public.sync_application_status_from_event() to authenticated;

drop trigger if exists application_events_sync_status on public.application_events;
create trigger application_events_sync_status
after insert on public.application_events
for each row execute function public.sync_application_status_from_event();

insert into public.application_events (
  application_id,
  user_id,
  event_type,
  occurred_at,
  metadata
)
select id, user_id, 'created', created_at, '{}'::jsonb
from public.applications
where not exists (
  select 1 from public.application_events events
  where events.application_id = applications.id
    and events.event_type = 'created'
);

insert into public.application_events (
  application_id,
  user_id,
  event_type,
  occurred_at,
  metadata
)
select
  id,
  user_id,
  'legacy_status_imported',
  null,
  jsonb_build_object('status', status::text)
from public.applications
where status <> 'Pending'::application_status
  and not exists (
    select 1 from public.application_events events
    where events.application_id = applications.id
      and events.event_type = 'legacy_status_imported'
  );

alter table public.generation_jobs
  drop constraint if exists generation_jobs_status_check;

alter table public.generation_jobs
  add constraint generation_jobs_status_check
  check (status in ('queued', 'running', 'needs_input', 'succeeded', 'failed', 'cancelled'));

alter table public.generation_jobs
  add column if not exists working_state jsonb not null default '{}'::jsonb,
  add column if not exists pending_questions jsonb not null default '[]'::jsonb,
  add column if not exists accepted_evidence_ids uuid[] not null default '{}',
  add column if not exists prompt_version text,
  add column if not exists schema_version text,
  add column if not exists model_config jsonb not null default '{}'::jsonb,
  add column if not exists usage_metrics jsonb not null default '{}'::jsonb,
  add column if not exists quality_report jsonb not null default '{}'::jsonb,
  add column if not exists repair_count integer not null default 0
    check (repair_count between 0 and 1);

alter table public.applications
  add column if not exists tailoring_run_id uuid references public.generation_jobs(id) on delete set null;

create unique index if not exists applications_tailoring_run_unique_idx
  on public.applications (tailoring_run_id)
  where tailoring_run_id is not null;

create unique index if not exists application_events_one_created_idx
  on public.application_events (application_id, event_type)
  where event_type = 'created';

create table if not exists public.application_private_artifacts (
  application_id uuid primary key references public.applications(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_analysis jsonb not null default '{}'::jsonb,
  evidence_resolution jsonb not null default '{}'::jsonb,
  content_strategy jsonb not null default '{}'::jsonb,
  quality_report jsonb not null default '{}'::jsonb,
  render_review jsonb not null default '{}'::jsonb,
  diagnostics jsonb not null default '{}'::jsonb,
  rewrite_insights jsonb not null default '{}'::jsonb,
  prompt_preview text not null default '',
  selected_playbook_id text,
  generation_options jsonb not null default '{}'::jsonb,
  edit_suggestions jsonb not null default '[]'::jsonb,
  regeneration_history jsonb not null default '[]'::jsonb,
  model_config jsonb not null default '{}'::jsonb,
  usage_metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.application_private_artifacts enable row level security;

create policy "Users can view their own private application artifacts"
  on public.application_private_artifacts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own private application artifacts"
  on public.application_private_artifacts for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.applications
      where applications.id = application_private_artifacts.application_id
        and applications.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own private application artifacts"
  on public.application_private_artifacts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Preserve legacy tailoring output as private evaluation baselines, then remove it
-- from application rows covered by the historical public-by-slug select policy.
insert into public.application_private_artifacts (
  application_id,
  user_id,
  job_analysis,
  evidence_resolution,
  diagnostics,
  rewrite_insights,
  prompt_preview,
  selected_playbook_id,
  generation_options,
  edit_suggestions,
  regeneration_history
)
select
  id,
  user_id,
  coalesce(job_analysis, '{}'::jsonb),
  coalesce(evidence_resolution, '{}'::jsonb),
  coalesce(diagnostics, '{}'::jsonb),
  coalesce(rewrite_insights, '{}'::jsonb),
  coalesce(prompt_preview, ''),
  selected_playbook_id,
  coalesce(generation_options, '{}'::jsonb),
  coalesce(edit_suggestions, '[]'::jsonb),
  coalesce(regeneration_history, '[]'::jsonb)
from public.applications
on conflict (application_id) do nothing;

update public.applications
set
  job_analysis = '{}'::jsonb,
  evidence_resolution = '{}'::jsonb,
  diagnostics = '{}'::jsonb,
  rewrite_insights = '{}'::jsonb,
  prompt_preview = null,
  selected_playbook_id = null,
  generation_options = '{}'::jsonb,
  edit_suggestions = '[]'::jsonb,
  regeneration_history = '[]'::jsonb;

grant select, insert, update, delete on public.candidate_evidence to authenticated;
grant select, insert on public.candidate_evidence_usage to authenticated;
grant select, insert, update, delete on public.application_events to authenticated;
grant select, insert, update on public.application_private_artifacts to authenticated;

comment on table public.candidate_evidence is
  'Owner-only reusable STAR evidence used to ground resume and cover-letter claims.';
comment on table public.candidate_evidence_usage is
  'Owner-only history of where reusable evidence was selected by a tailoring run.';
comment on table public.application_events is
  'Owner-only application outcome timeline; occurred_at remains null when a historical date is unknown.';
comment on table public.application_private_artifacts is
  'Owner-only Tailoring v2 evidence plans, prompts, model configuration, usage, and quality reports.';
