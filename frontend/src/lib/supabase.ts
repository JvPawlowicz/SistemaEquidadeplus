import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const hasConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasConfig) {
  console.warn(
    'EquidadePlus: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos em .env para usar o Supabase.'
  );
}

const urlForClient = hasConfig ? supabaseUrl : 'https://placeholder.supabase.co';
const keyForClient = hasConfig ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(urlForClient, keyForClient);
