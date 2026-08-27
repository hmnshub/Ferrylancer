import { Router } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

const router = Router();

/**
 * GET /api/search?q=react+developer&type=projects|people|all
 *
 * A single search box on the frontend (Discover, top nav) needs to search
 * across multiple tables with different rank signals — heavier than a
 * single Supabase `.ilike()` call, and the kind of thing that benefits from
 * living server-side so we can tune ranking without shipping a new
 * frontend build.
 */
router.get("/", async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured on server" });

    const q = (req.query.q || "").trim();
    const type = req.query.type || "all";
    if (!q) return res.json({ projects: [], people: [] });

    const like = `%${q}%`;
    const results = { projects: [], people: [] };

    if (type === "all" || type === "projects") {
      const { data, error } = await supabaseAdmin
        .from("projects")
        .select("*")
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(20);
      if (error) throw error;
      results.projects = data;
    }

    if (type === "all" || type === "people") {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, title, company_name, role, avatar_url, location")
        .or(`full_name.ilike.${like},title.ilike.${like},company_name.ilike.${like}`)
        .limit(20);
      if (error) throw error;
      results.people = data;
    }

    res.json(results);
  } catch (err) {
    console.error("Search failed:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
