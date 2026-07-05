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
