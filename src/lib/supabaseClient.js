import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('Supabase init:', { url: supabaseUrl ? 'set' : 'missing', key: supabaseAnonKey ? 'set' : 'missing' });

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing. Check REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
