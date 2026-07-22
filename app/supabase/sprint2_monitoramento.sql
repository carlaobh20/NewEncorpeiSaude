-- ============================================================
-- SPRINT 2 — MONITORAMENTO CLÍNICO (Encorpei Saúde)
-- Sintomas + aparelhos + plano de monitoramento + motor de alertas
-- Rodar no Supabase: SQL Editor → New query → colar tudo → Run
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- Pré-requisito: tabela care_links já existe (vínculo profissional↔paciente).
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 0. Helper: o usuário logado é profissional ativo deste paciente?
-- -------------------------------------------------------------
create or replace function public.is_care_professional(p_patient uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from care_links
    where patient_id = p_patient
      and professional_id = auth.uid()
      and status = 'active'
  );
$$;

-- -------------------------------------------------------------
-- 1. Diário de sintomas (slugs internos; a UI usa linguagem leiga)
-- --------------------------------------------------------------
create table if not exists public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symptom text not null check (symptom in
    ('falta_de_ar','dor_no_peito','palpitacoes','inchaco_pernas','tontura','fadiga')),
  intensity int not null check (intensity between 0 and 10),
  context text check (context is null or context in ('repouso','esforco','deitado')),
  notes text,
  recorded_at timestamptz not null default now()
);
create index if not exists idx_symptom_logs_user on public.symptom_logs (user_id, recorded_at desc);

alter table public.symptom_logs enable row level security;
drop policy if exists symptom_sel on public.symptom_logs;
create policy symptom_sel on public.symptom_logs for select
  using (user_id = auth.uid() or public.is_care_professional(user_id));
drop policy if exists symptom_ins on public.symptom_logs;
create policy symptom_ins on public.symptom_logs for insert
  with check (user_id = auth.uid());
drop policy if exists symptom_del on public.symptom_logs;
create policy symptom_del on public.symptom_logs for delete
  using (user_id = auth.uid());

-- -------------------------------------------------------------
-- 2. Aparelhos confirmados pelo paciente ("tenho e sei usar")
-- -------------------------------------------------------------
create table if not exists public.patient_devices (
  user_id uuid not null references auth.users(id) on delete cascade,
  device text not null check (device in ('pressao','glicemia','oximetro','balanca')),
  confirmed_at timestamptz not null default now(),
  primary key (user_id, device)
);
alter table public.patient_devices enable row level security;
drop policy if exists pdev_sel on public.patient_devices;
create policy pdev_sel on public.patient_devices for select
  using (user_id = auth.uid() or public.is_care_professional(user_id));
drop policy if exists pdev_ins on public.patient_devices;
create policy pdev_ins on public.patient_devices for insert
  with check (user_id = auth.uid());
drop policy if exists pdev_del on public.patient_devices;
create policy pdev_del on public.patient_devices for delete
  using (user_id = auth.uid());

-- -------------------------------------------------------------
-- 3. Plano de monitoramento (prescrição de registro)
-- -------------------------------------------------------------
create table if not exists public.monitoring_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  professional_id uuid not null references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (patient_id, professional_id)
);
alter table public.monitoring_plans enable row level security;
drop policy if exists mplan_sel on public.monitoring_plans;
create policy mplan_sel on public.monitoring_plans for select
  using (patient_id = auth.uid() or professional_id = auth.uid());
drop policy if exists mplan_ins on public.monitoring_plans;
create policy mplan_ins on public.monitoring_plans for insert
  with check (professional_id = auth.uid() and public.is_care_professional(patient_id));
drop policy if exists mplan_upd on public.monitoring_plans;
create policy mplan_upd on public.monitoring_plans for update
  using (professional_id = auth.uid()) with check (professional_id = auth.uid());
drop policy if exists mplan_del on public.monitoring_plans;
create policy mplan_del on public.monitoring_plans for delete
  using (professional_id = auth.uid());

create table if not exists public.monitoring_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.monitoring_plans(id) on delete cascade,
  item text not null check (item in ('peso','pressao','glicemia','sintomas','agua','sono')),
  frequency text not null default 'diario' check (frequency in ('diario','semanal','conforme_orientado')),
  requires_device text check (requires_device is null or requires_device in ('pressao','glicemia','oximetro','balanca')),
  created_at timestamptz not null default now(),
  unique (plan_id, item)
);
alter table public.monitoring_plan_items enable row level security;
drop policy if exists mpi_sel on public.monitoring_plan_items;
create policy mpi_sel on public.monitoring_plan_items for select
  using (exists (select 1 from public.monitoring_plans mp
                 where mp.id = plan_id and (mp.patient_id = auth.uid() or mp.professional_id = auth.uid())));
drop policy if exists mpi_ins on public.monitoring_plan_items;
create policy mpi_ins on public.monitoring_plan_items for insert
  with check (exists (select 1 from public.monitoring_plans mp
                      where mp.id = plan_id and mp.professional_id = auth.uid()));
drop policy if exists mpi_del on public.monitoring_plan_items;
create policy mpi_del on public.monitoring_plan_items for delete
  using (exists (select 1 from public.monitoring_plans mp
                 where mp.id = plan_id and mp.professional_id = auth.uid()));

-- -------------------------------------------------------------
-- 4. Regras de alerta (definidas pelo profissional, por paciente)
--    O APP NUNCA INTERPRETA: só compara número com a faixa da regra.
-- -------------------------------------------------------------
create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  professional_id uuid not null references auth.users(id) on delete cascade,
  metric text not null check (metric in
    ('pa_sistolica','pa_diastolica','pulso','glicemia','peso_ganho_kg_72h','sintoma')),
  symptom text check (symptom is null or symptom in
    ('falta_de_ar','dor_no_peito','palpitacoes','inchaco_pernas','tontura','fadiga')),
  operator text not null check (operator in ('>','<','>=','<=')),
  threshold numeric not null,
  severity text not null check (severity in ('amarelo','vermelho')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_alert_rules_patient on public.alert_rules (patient_id) where active;

alter table public.alert_rules enable row level security;
drop policy if exists arule_sel on public.alert_rules;
create policy arule_sel on public.alert_rules for select
  using (patient_id = auth.uid() or professional_id = auth.uid());
drop policy if exists arule_ins on public.alert_rules;
create policy arule_ins on public.alert_rules for insert
  with check (professional_id = auth.uid() and public.is_care_professional(patient_id));
drop policy if exists arule_upd on public.alert_rules;
create policy arule_upd on public.alert_rules for update
  using (professional_id = auth.uid()) with check (professional_id = auth.uid());
drop policy if exists arule_del on public.alert_rules;
create policy arule_del on public.alert_rules for delete
  using (professional_id = auth.uid());

-- -------------------------------------------------------------
-- 5. Alertas + trilha de auditoria (append-only para clientes)
-- -------------------------------------------------------------
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.alert_rules(id) on delete set null,
  patient_id uuid not null references auth.users(id) on delete cascade,
  professional_id uuid not null references auth.users(id) on delete cascade,
  metric text not null,
  observed_value numeric,
  severity text not null check (severity in ('amarelo','vermelho')),
  status text not null default 'aberto' check (status in ('aberto','visto','tratado')),
  source_table text,
  source_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_alerts_prof on public.alerts (professional_id, status, created_at desc);
create index if not exists idx_alerts_patient on public.alerts (patient_id, created_at desc);

alter table public.alerts enable row level security;
drop policy if exists alert_sel on public.alerts;
create policy alert_sel on public.alerts for select
  using (patient_id = auth.uid() or professional_id = auth.uid());
-- Único update permitido: o profissional dono muda o status.
drop policy if exists alert_upd on public.alerts;
create policy alert_upd on public.alerts for update
  using (professional_id = auth.uid()) with check (professional_id = auth.uid());
-- Sem policy de insert/delete para clientes: só o motor (security definer) insere.

create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts(id) on delete cascade,
  event text not null check (event in ('criado','visto','tratado')),
  actor uuid,
  created_at timestamptz not null default now()
);
alter table public.alert_events enable row level security;
drop policy if exists aev_sel on public.alert_events;
create policy aev_sel on public.alert_events for select
  using (exists (select 1 from public.alerts a
                 where a.id = alert_id and (a.patient_id = auth.uid() or a.professional_id = auth.uid())));
-- Sem insert/update/delete para clientes: imutável, escrita só via triggers.

-- -------------------------------------------------------------
-- 6. Motor de alertas (triggers security definer)
-- -------------------------------------------------------------
create or replace function public.fn_op(v numeric, op text, t numeric)
returns boolean language sql immutable as $$
  select case op
    when '>'  then v >  t
    when '<'  then v <  t
    when '>=' then v >= t
    when '<=' then v <= t
    else false end;
$$;

create or replace function public.fn_fire_alert(
  p_rule public.alert_rules, p_value numeric, p_src_table text, p_src_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_alert_id uuid;
begin
  if exists (select 1 from alerts a
             where a.rule_id = p_rule.id and a.status = 'aberto'
               and a.created_at > now() - interval '12 hours') then
    return;
  end if;
  insert into alerts (rule_id, patient_id, professional_id, metric, observed_value, severity, source_table, source_id)
  values (p_rule.id, p_rule.patient_id, p_rule.professional_id, p_rule.metric, p_value, p_rule.severity, p_src_table, p_src_id)
  returning id into v_alert_id;
  insert into alert_events (alert_id, event, actor) values (v_alert_id, 'criado', null);
end $$;

create or replace function public.fn_eval_bp()
returns trigger language plpgsql security definer set search_path = public as $$
declare r public.alert_rules; v numeric;
begin
  for r in select * from alert_rules
           where patient_id = new.user_id and active
             and metric in ('pa_sistolica','pa_diastolica','pulso') loop
    v := case r.metric
           when 'pa_sistolica'  then new.systolic
           when 'pa_diastolica' then new.diastolic
           else new.pulse end;
    if v is not null and public.fn_op(v, r.operator, r.threshold) then
      perform public.fn_fire_alert(r, v, 'blood_pressure', new.id);
    end if;
  end loop;
  return new;
end $$;

create or replace function public.fn_eval_glucose()
returns trigger language plpgsql security definer set search_path = public as $$
declare r public.alert_rules;
begin
  for r in select * from alert_rules
           where patient_id = new.user_id and active and metric = 'glicemia' loop
    if public.fn_op(new.value_mgdl, r.operator, r.threshold) then
      perform public.fn_fire_alert(r, new.value_mgdl, 'glucose_logs', new.id);
    end if;
  end loop;
  return new;
end $$;

create or replace function public.fn_eval_symptom()
returns trigger language plpgsql security definer set search_path = public as $$
declare r public.alert_rules;
begin
  for r in select * from alert_rules
           where patient_id = new.user_id and active and metric = 'sintoma'
             and (symptom is null or symptom = new.symptom) loop
    if public.fn_op(new.intensity, r.operator, r.threshold) then
      perform public.fn_fire_alert(r, new.intensity, 'symptom_logs', new.id);
    end if;
  end loop;
  return new;
end $$;

create or replace function public.fn_eval_weight_gain()
returns trigger language plpgsql security definer set search_path = public as $$
declare r public.alert_rules; v_min numeric; v_gain numeric;
begin
  select min(kg) into v_min from weights
  where user_id = new.user_id and date >= new.date - 3 and date < new.date;
  if v_min is null then return new; end if;
  v_gain := new.kg - v_min;
  for r in select * from alert_rules
           where patient_id = new.user_id and active and metric = 'peso_ganho_kg_72h' loop
    if public.fn_op(v_gain, r.operator, r.threshold) then
      perform public.fn_fire_alert(r, round(v_gain, 1), 'weights', new.id);
    end if;
  end loop;
  return new;
end $$;

create or replace function public.fn_alert_status_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('visto','tratado') then
    insert into alert_events (alert_id, event, actor) values (new.id, new.status, auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists trg_eval_symptom on public.symptom_logs;
create trigger trg_eval_symptom after insert on public.symptom_logs
  for each row execute function public.fn_eval_symptom();

do $$ begin
  if to_regclass('public.blood_pressure') is not null then
    drop trigger if exists trg_eval_bp on public.blood_pressure;
    create trigger trg_eval_bp after insert on public.blood_pressure
      for each row execute function public.fn_eval_bp();
  end if;
end $$;

do $$ begin
  if to_regclass('public.glucose_logs') is not null then
    drop trigger if exists trg_eval_glucose on public.glucose_logs;
    create trigger trg_eval_glucose after insert on public.glucose_logs
      for each row execute function public.fn_eval_glucose();
  end if;
end $$;

do $$ begin
  if to_regclass('public.weights') is not null then
    drop trigger if exists trg_eval_weight on public.weights;
    create trigger trg_eval_weight after insert or update of kg on public.weights
      for each row execute function public.fn_eval_weight_gain();
  end if;
end $$;

drop trigger if exists trg_alert_status_audit on public.alerts;
create trigger trg_alert_status_audit after update on public.alerts
  for each row execute function public.fn_alert_status_audit();
