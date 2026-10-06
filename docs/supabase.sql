-- Gedeelde tabel voor kleine app-gegevens (o.a. het leaderboard van Pirates of Port Zélande).
-- Staat deze tabel al in je Supabase-project? Dan hoef je niets te doen.
-- Anders: plak dit in Supabase → SQL Editor en klik "Run".
--
-- Het spel slaat elke score op als: app = 'portzelande', key = 'leaderboard',
-- value = {"name": "...", "score": 1234, "timeMs": 1500000, "date": "..."}.

create table if not exists app_data (
  id bigint generated always as identity primary key,
  app text not null,
  key text not null,
  value jsonb not null check (length(value::text) < 2000),
  created_at timestamptz default now()
);

alter table app_data enable row level security;

-- Iedereen mag lezen en toevoegen; niemand mag wijzigen of verwijderen
-- (dat kan alleen de beheerder via de Table Editor in Supabase).
drop policy if exists "lezen" on app_data;
drop policy if exists "toevoegen" on app_data;
create policy "lezen" on app_data for select using (true);
create policy "toevoegen" on app_data for insert with check (true);

-- Optioneel: sneller ophalen als de tabel groot wordt.
create index if not exists app_data_app_key on app_data (app, key);
