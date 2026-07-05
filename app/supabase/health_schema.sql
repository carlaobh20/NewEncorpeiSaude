-- Encorpei · Sono e Alimentação (rode no SQL Editor)

create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null, hours numeric, quality int,
  created_at timestamptz default now(),
  unique (user_id, date)
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  type text, name text, calories int default 0, protein int default 0,
  created_at timestamptz default now()
);

alter table public.sleep_logs enable row level security;
alter table public.meals      enable row level security;

do $$
declare t text;
begin
  foreach t in array array['sleep_logs','meals'] loop
    execute format('drop policy if exists own_rows on public.%I;', t);
    execute format('create policy own_rows on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;
