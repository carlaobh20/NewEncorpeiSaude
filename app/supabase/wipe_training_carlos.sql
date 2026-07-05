-- LIMPA todos os treinos/sessões do Carlos. Rode no SQL Editor.
-- Depois, ao abrir o app logado, o programa A–E é semeado de novo, limpo.
do $$
declare uid uuid;
begin
  select id into uid from auth.users where email = 'carloshenriqueferro@hotmail.com';
  delete from public.session_sets      where user_id = uid;
  delete from public.training_sessions where user_id = uid;
  delete from public.routine_exercises where user_id = uid;
  delete from public.routines          where user_id = uid;
end $$;
