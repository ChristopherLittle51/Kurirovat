-- Create a table for user profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  email text,
  phone text,
  location text,
  summary text,
  skills text[], -- Array of strings
  experience jsonb, -- Storing complex objects as JSONB for simplicity
  education jsonb,
  links jsonb
);

-- Set up Row Level Security (RLS) for profiles
alter table profiles enable row level security;

create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- Create a table for applications (tailored resumes)
create table applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  company_name text not null,
  role_title text,
  raw_job_description text,
  resume_data jsonb, -- Tailored resume
  cover_letter text,
  match_score numeric,
  key_keywords text[],
  search_sources jsonb,
  slug text unique -- For public access: /company-name
);

-- Set up RLS for applications
alter table applications enable row level security;

create policy "Users can view their own applications" on applications
  for select using (auth.uid() = user_id);

create policy "Users can insert their own applications" on applications
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own applications" on applications
  for update using (auth.uid() = user_id);

create policy "Users can delete their own applications" on applications
  for delete using (auth.uid() = user_id);

-- Public access policy for fetching by slug
create policy "Public can view applications by slug" on applications
  for select using (true);

-- Function to handle new user creation automatically (optional, but good practice)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
