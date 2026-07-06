-- Encorpei · Minha Academia (aparelhos do usuário). Rode no SQL Editor.
create table if not exists public.gym_equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, created_at timestamptz default now()
);
alter table public.gym_equipment enable row level security;
drop policy if exists own_rows on public.gym_equipment;
create policy own_rows on public.gym_equipment for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
