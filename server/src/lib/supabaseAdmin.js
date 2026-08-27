import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn(
    "[ferrylance-server] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — " +
      "Supabase-backed routes will fail until you fill in server/.env (see .env.example)."
  );
}

// Service-role client: bypasses Row Level Security, so this must NEVER be
// exposed to the browser. Only use it for trusted server-side operations
// (heavy processing, admin actions, cross-user aggregation).
export const supabaseAdmin =
  url && serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;
