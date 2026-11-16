import { createClient } from '@supabase/supabase-js';

// À utiliser uniquement côté serveur : la clé secrète ne doit jamais
// arriver dans le navigateur (d'où l'absence du préfixe NEXT_PUBLIC_).
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (voir .env.example).',
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}