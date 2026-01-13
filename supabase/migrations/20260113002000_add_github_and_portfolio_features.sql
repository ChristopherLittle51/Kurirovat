alter table profiles add column if not exists github_username text;
alter table applications add column if not exists github_projects jsonb;
alter table applications add column if not exists show_match_score boolean default true;
