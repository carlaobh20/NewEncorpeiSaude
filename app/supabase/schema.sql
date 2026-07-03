-- Encorpei · schema inicial do Paciente (Supabase / PostgreSQL)
-- Rode no SQL editor do seu projeto. RLS liga cada linha ao usuário logado.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  height_cm int,
  target_kg numeric,
  water_goal_ml int default 2500,
  workout_goal_per_week int default 4,
  created_at timestamptz default now()
);

create table if not exists public.weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  kg numeric not null,
  created_at timestamptz default now(),
  unique (user_id, date)
);

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  ml int not null default 0,
  unique (user_id, date)
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  name text not null,
  sets jsonb default '[]'::jsonb,
  done boolean default true,
  created_at timestamptz default now()
);

-- Row Level Security: cada usuário só enxerga os próprios dados
alter table public.profiles    enable row level security;
alter table public.weights     enable row level security;
alter table public.water_logs  enable row level security;
alter table public.workouts    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles','weights','water_logs','workouts'] loop
    execute format('drop policy if exists own_rows on public.%I;', t);
    if t = 'profiles' then
      execute format('create policy own_rows on public.%I for all using (auth.uid() = id) with check (auth.uid() = id);', t);
    else
      execute format('create policy own_rows on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    end if;
  end loop;
end $$;
