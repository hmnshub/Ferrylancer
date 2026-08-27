import { createClient } from '@supabase/supabase-js';

// Add these to a .env file at the project root (Vite requires the VITE_ prefix):
//   VITE_SUPABASE_URL=https://your-project.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Non-fatal: lets the landing page still render/build before Supabase is wired up.
  console.warn(
    '[Ferrylance] Supabase env vars are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file to enable data fetching.'
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Keeping this nullable lets the marketing site run when credentials have not
// been added yet, while authentication can show a useful message instead.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Example usage once your tables exist:
//   const { data, error } = await supabase.from('talent').select('*').limit(8);
//   const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
