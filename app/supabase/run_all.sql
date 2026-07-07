-- ============================================================
-- ENCORPEI · SQL CONSOLIDADO — rode TUDO de uma vez no SQL Editor.
-- Idempotente: pode rodar de novo sem quebrar nada.
-- ============================================================

-- ===== schema.sql =====
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

-- ===== fix_profiles.sql =====
-- Corrige a tabela profiles: garante as colunas usadas pelo app. Rode no SQL Editor.
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists height_cm int;
alter table public.profiles add column if not exists target_kg numeric;
alter table public.profiles add column if not exists goal_date date;
alter table public.profiles add column if not exists water_goal_ml int default 2500;
alter table public.profiles add column if not exists workout_goal_per_week int default 5;
-- força o PostgREST a recarregar o cache de schema
notify pgrst, 'reload schema';

-- ===== training_schema.sql =====
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

-- ===== musc_extra_schema.sql =====
-- Encorpei · Avaliações e Fotos (rode no SQL Editor)

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  weight numeric, body_fat numeric,
  chest numeric, waist numeric, hip numeric, arm numeric, thigh numeric,
  note text, created_at timestamptz default now()
);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  url text not null, pose text, created_at timestamptz default now()
);

alter table public.assessments     enable row level security;
alter table public.progress_photos enable row level security;

do $$
declare t text;
begin
  foreach t in array array['assessments','progress_photos'] loop
    execute format('drop policy if exists own_rows on public.%I;', t);
    execute format('create policy own_rows on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;

-- Storage p/ fotos: crie um bucket público chamado "progress-photos" em Storage (painel).

-- ===== health_schema.sql =====
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

-- ===== gym_schema.sql =====
-- Encorpei · Minha Academia (aparelhos do usuário). Rode no SQL Editor.
create table if not exists public.gym_equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, created_at timestamptz default now()
);
alter table public.gym_equipment enable row level security;
drop policy if exists own_rows on public.gym_equipment;
create policy own_rows on public.gym_equipment for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===== modules_schema.sql =====
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
notify pgrst, 'reload schema';
