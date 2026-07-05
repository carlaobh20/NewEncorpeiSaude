-- Encorpei · Esquema de treino (rode no SQL Editor do Supabase)
-- Cria rotinas, exercícios, sessões e séries registradas. Segurança por usuário (RLS).

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text, name text, focus text,
  day_of_week int, cardio_min int default 0, position int default 0,
  muscles text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade,
  name text, muscle text,
  target_sets int default 3, target_reps text default '10',
  rest_sec int default 60, position int default 0, note text
);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid, name text,
  started_at timestamptz default now(), finished_at timestamptz,
  total_volume numeric default 0, duration_sec int default 0
);

create table if not exists public.session_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.training_sessions(id) on delete cascade,
  exercise_name text, set_index int,
  load numeric, reps int, rpe int, done boolean default true
);

alter table public.routines           enable row level security;
alter table public.routine_exercises  enable row level security;
alter table public.training_sessions  enable row level security;
alter table public.session_sets       enable row level security;

do $$
declare t text;
begin
  foreach t in array array['routines','routine_exercises','training_sessions','session_sets'] loop
    execute format('drop policy if exists own_rows on public.%I;', t);
    execute format('create policy own_rows on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;
