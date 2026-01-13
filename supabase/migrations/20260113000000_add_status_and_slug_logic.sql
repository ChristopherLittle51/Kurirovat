-- Create Enum for Application Status
create type application_status as enum ('Pending', 'Sent', 'Replied', 'Interview Scheduled', 'Rejected');

-- Add status column to applications table
alter table applications 
add column status application_status default 'Pending'::application_status;

-- Basic slugify function
create or replace function slugify(value text)
returns text as $$
begin
  -- Lowercase, replace non-alphanumeric with '-', trim dashes
  return trim(both '-' from lower(regexp_replace(value, '[^a-zA-Z0-9]+', '-', 'g')));
end;
$$ language plpgsql immutable strict;

-- Trigger function to generate unique slug
create or replace function set_unique_slug()
returns trigger as $$
declare
  base_slug text;
  new_slug text;
  counter int := 1;
begin
  -- If slug is already provided and not empty, check uniqueness (or trust it? better to enforce our logic if user wants clean slugs)
  -- The user requirement is "generate slugs...", implying the system should do it.
  -- Let's derive it from company_name if slug is null or empty.
  
  if new.slug is null or new.slug = '' then
    if new.company_name is null then
      raise exception 'company_name is required to generate slug';
    end if;
    
    base_slug := slugify(new.company_name);
    new_slug := base_slug;
    
    -- Loop to find unique slug
    loop
      if counter > 1 then
        new_slug := base_slug || '-' || counter;
      end if;
      
      -- Check if exists. NOTE: This might have a race condition in high concurrency but sufficient for this app.
      if not exists (select 1 from applications where slug = new_slug) then
        exit;
      end if;
      
      counter := counter + 1;
    end loop;
    
    new.slug := new_slug;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Create trigger
create trigger ensure_unique_slug
before insert on applications
for each row
execute function set_unique_slug();
