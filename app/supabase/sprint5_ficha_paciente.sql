-- ============================================================
-- SPRINT 5 — Ficha de saúde do paciente + foto de perfil
-- Rode no Supabase: SQL Editor → New query → colar tudo → Run.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

-- -------------------------------------------------------------
-- 0. Achado de schema (não corrigido aqui, só registrado): a
--    tabela public.profiles hoje tem pelo menos uma policy de RLS
--    que não está em nenhum arquivo versionado deste repositório
--    (foi criada direto no painel do Supabase em algum momento) —
--    é o que já permite hoje o profissional ler nome do paciente
--    vinculado (usado em lib/careLinks.ts). Não sabemos o texto
--    exato dela. Em vez de tentar substituir às cegas, a policy
--    abaixo (profiles_pro_sel) é só ADITIVA: cria uma policy nova,
--    com nome próprio, que garante esse acesso de forma explícita
--    e documentada — não remove nem depende da policy antiga.
-- -------------------------------------------------------------

alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists biological_sex text check (biological_sex is null or biological_sex in ('feminino','masculino','prefiro_nao_informar'));
alter table public.profiles add column if not exists chronic_conditions text;
alter table public.profiles add column if not exists allergies text;
alter table public.profiles add column if not exists current_medications text;
alter table public.profiles add column if not exists mobility text check (mobility is null or mobility in ('sem_limitacao','bengala_andador','cadeira_rodas','outra'));
alter table public.profiles add column if not exists mobility_notes text;
alter table public.profiles add column if not exists photo_url text;
alter table public.profiles add column if not exists interview_completed_at timestamptz;

drop policy if exists profiles_pro_sel on public.profiles;
create policy profiles_pro_sel on public.profiles for select
  using (public.is_care_professional(id));

-- -------------------------------------------------------------
-- 1. Bucket de foto de perfil (público, mesmo padrão de progress-photos:
--    a URL não é adivinhável, mas quem tiver o link consegue abrir).
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

drop policy if exists profile_photos_ins on storage.objects;
create policy profile_photos_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists profile_photos_upd on storage.objects;
create policy profile_photos_upd on storage.objects for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';
