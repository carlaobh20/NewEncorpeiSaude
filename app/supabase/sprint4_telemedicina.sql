-- ============================================================
-- SPRINT 4 — Telemedicina Fase 1 (cadastro + agenda + reserva)
-- Sem vídeo ainda; sem interpretar dado clínico. Tabelas novas e
-- isoladas — não mexe em `consultations`/`care_links` existentes.
-- Rode no Supabase: SQL Editor → New query → colar tudo → Run.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- 1. Perfil de telemedicina do profissional (opt-in: `listed`
--    começa em false — só aparece pro paciente depois que o
--    próprio profissional decide se listar).
-- -------------------------------------------------------------
create table if not exists public.telemedicine_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  specialty text not null default '',
  crm text,
  bio text,
  listed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.telemedicine_profiles enable row level security;
drop policy if exists tp_sel on public.telemedicine_profiles;
create policy tp_sel on public.telemedicine_profiles for select
  using (listed = true or user_id = auth.uid());
drop policy if exists tp_ins on public.telemedicine_profiles;
create policy tp_ins on public.telemedicine_profiles for insert
  with check (user_id = auth.uid());
drop policy if exists tp_upd on public.telemedicine_profiles;
create policy tp_upd on public.telemedicine_profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -------------------------------------------------------------
-- 2. Disponibilidade semanal recorrente do profissional.
-- -------------------------------------------------------------
create table if not exists public.telemedicine_availability (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references auth.users(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0=dom .. 6=sáb
  start_time time not null,
  end_time time not null check (end_time > start_time),
  slot_minutes int not null default 30 check (slot_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (professional_id, weekday, start_time)
);
alter table public.telemedicine_availability enable row level security;
drop policy if exists tav_sel on public.telemedicine_availability;
create policy tav_sel on public.telemedicine_availability for select
  using (
    professional_id = auth.uid()
    or exists (select 1 from public.telemedicine_profiles tp where tp.user_id = professional_id and tp.listed = true)
  );
drop policy if exists tav_ins on public.telemedicine_availability;
create policy tav_ins on public.telemedicine_availability for insert
  with check (professional_id = auth.uid());
drop policy if exists tav_upd on public.telemedicine_availability;
create policy tav_upd on public.telemedicine_availability for update
  using (professional_id = auth.uid()) with check (professional_id = auth.uid());
drop policy if exists tav_del on public.telemedicine_availability;
create policy tav_del on public.telemedicine_availability for delete
  using (professional_id = auth.uid());

-- -------------------------------------------------------------
-- 3. Reservas. O paciente só consegue reservar profissional
--    listado (listed = true) — trava no próprio banco, não só na tela.
-- -------------------------------------------------------------
create table if not exists public.telemedicine_bookings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  professional_id uuid not null references auth.users(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'solicitada' check (status in ('solicitada','confirmada','cancelada','realizada')),
  notes text,
  created_at timestamptz not null default now(),
  unique (professional_id, scheduled_at)
);
create index if not exists idx_tbook_patient on public.telemedicine_bookings (patient_id, scheduled_at);
create index if not exists idx_tbook_pro on public.telemedicine_bookings (professional_id, scheduled_at);

alter table public.telemedicine_bookings enable row level security;
drop policy if exists tbook_sel on public.telemedicine_bookings;
create policy tbook_sel on public.telemedicine_bookings for select
  using (patient_id = auth.uid() or professional_id = auth.uid());
drop policy if exists tbook_ins on public.telemedicine_bookings;
create policy tbook_ins on public.telemedicine_bookings for insert
  with check (
    patient_id = auth.uid()
    and exists (select 1 from public.telemedicine_profiles tp where tp.user_id = professional_id and tp.listed = true)
  );
drop policy if exists tbook_upd on public.telemedicine_bookings;
create policy tbook_upd on public.telemedicine_bookings for update
  using (patient_id = auth.uid() or professional_id = auth.uid())
  with check (patient_id = auth.uid() or professional_id = auth.uid());

notify pgrst, 'reload schema';
