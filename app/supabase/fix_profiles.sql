-- Corrige a tabela profiles: garante as colunas usadas pelo app. Rode no SQL Editor.
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists height_cm int;
alter table public.profiles add column if not exists target_kg numeric;
alter table public.profiles add column if not exists goal_date date;
alter table public.profiles add column if not exists water_goal_ml int default 2500;
alter table public.profiles add column if not exists workout_goal_per_week int default 5;
-- força o PostgREST a recarregar o cache de schema
notify pgrst, 'reload schema';
