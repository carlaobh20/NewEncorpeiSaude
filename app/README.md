# Encorpei · Paciente (MVP web)

App web do módulo **Paciente** do Encorpei Health OS. Dashboard com Health Score,
missão do dia e trackers de **peso** (com gráfico), **água** e **treino**.

## Rodar localmente
```bash
cd app
npm install
npm run dev        # http://localhost:5173
```
Hoje roda com **dados de demonstração** salvos no navegador (localStorage).

## Conectar o Supabase (persistência real)
1. Crie um projeto em https://supabase.com
2. No SQL editor, rode `supabase/schema.sql`
3. `cp .env.example .env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
4. `npm i @supabase/supabase-js` e descomente o bloco em `src/lib/supabase.ts`

## Deploy (Vercel)
Import do repositório → root `app/` → build `npm run build` → output `dist`.

## Stack
React + Vite + TypeScript + Tailwind + Recharts. Supabase pronto para plugar.
