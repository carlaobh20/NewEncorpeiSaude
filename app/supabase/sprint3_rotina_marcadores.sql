-- ============================================================
-- SPRINT 3 — Marcadores por especialidade + correção de bug real
-- Rode no Supabase: SQL Editor → New query → colar tudo → Run.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

-- -------------------------------------------------------------
-- 0. Bug pré-existente encontrado agora: a lista de itens de plano
--    no código (PLAN_ITEMS, em src/lib/monitoring.ts) já incluía
--    'medicamentos' como opção pro profissional escolher, mas a
--    trava do banco (check constraint) nunca permitiu esse valor —
--    ou seja, se algum profissional já tentou adicionar
--    "Tomar os medicamentos" ao plano de um paciente, isso falhou
--    silenciosamente com erro de banco. Corrige isso e, no mesmo
--    passo, libera 'treino' (novo item — plano de rotina agora
--    permite o personal trainer prescrever "Registrar o treino").
-- -------------------------------------------------------------
alter table public.monitoring_plan_items drop constraint if exists monitoring_plan_items_item_check;
alter table public.monitoring_plan_items add constraint monitoring_plan_items_item_check
  check (item in ('peso','pressao','glicemia','sintomas','agua','sono','medicamentos','treino'));

notify pgrst, 'reload schema';
