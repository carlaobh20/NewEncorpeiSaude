-- Encorpei · Jejum, Suplementos, Agenda. Rode no SQL Editor.
create table if not exists public.fasting_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_at timestamptz not null default now(),
  target_hours numeric not null default 16,
  end_at timestamptz, created_at timestamptz default now()
);
create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, dose text, time_label text, created_at timestamptz default now()
);
create table if not exists public.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supplement_id uuid references public.supplements(id) on delete cascade,
  date date not null, taken boolean default true,
  unique (supplement_id, date)
);
alter table public.fasting_sessions enable row level security;
alter table public.supplements      enable row level security;
alter table public.supplement_logs  enable row level security;
do $$ declare t text; begin
  foreach t in array array['fasting_sessions','supplements','supplement_logs'] loop
    execute format('drop policy if exists own_rows on public.%I;', t);
    execute format('create policy own_rows on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;
