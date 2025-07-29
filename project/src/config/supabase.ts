import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database helper functions
export const db = {
  from: (table: string) => supabase.from(table),
  rpc: (fn: string, args?: any) => supabase.rpc(fn, args),
  storage: supabase.storage,
  auth: supabase.auth,
  channel: (name: string) => supabase.channel(name),
  realtime: supabase.realtime
};