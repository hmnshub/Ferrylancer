import { supabaseAdmin } from "../lib/supabaseAdmin.js";

/**
 * The frontend sends the user's Supabase access token as:
 *   Authorization: Bearer <access_token>
 * (available client-side as `session.access_token` after supabase.auth.getSession()).
 *
 * This middleware verifies that token against Supabase and attaches the
 * resulting user to `req.user`. Routes that need to know "who is calling"
 * (posting, proposing, messaging, uploading a file for their own profile)
 * should use this; purely public read endpoints can skip it.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Server is not configured with Supabase credentials" });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error("Auth check failed:", err);
    res.status(500).json({ error: "Auth check failed" });
  }
}
