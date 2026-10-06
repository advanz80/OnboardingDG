// Gedeeld leaderboard via Supabase.
//
// Vul hieronder tussen de aanhalingstekens de gegevens van je Supabase-project in
// (Supabase → Project Settings → API):
//   PROJECT_URL = de "Project URL", bijv. 'https://abcdefgh.supabase.co'
//   ANON_KEY    = de "anon public" key (een lange code die met 'eyJ' begint)
// De anon-key is bedoeld om in een website te staan; zet hier NOOIT de service_role-key.
//
// Laat je ze leeg, dan bewaart het spel de scores alleen op het eigen apparaat.
// De tabel app_data maak je (eenmalig) aan met docs/supabase.sql (zie README → Leaderboard).

const PROJECT_URL = 'https://bfvffvrbyzmzjorplsqp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdmZmdnJieXptempvcnBsc3FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwODgyMDUsImV4cCI6MjEwNjY2NDIwNX0.hFhUscSGsZGlVcW2gbbeAqK0EjhrVxRx7j0prvwGvZI';

export const LEADERBOARD = {
  // lokaal ontwikkelen kan ook met VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in een .env-bestand
  supabaseUrl: PROJECT_URL || import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  // scores komen in de gedeelde tabel app_data (zie docs/supabase.sql)
  table: 'app_data',
  app: 'OnboardingDG',
  key: 'leaderboard',
};
