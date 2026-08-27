import { Router } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

const router = Router();

/**
 * GET /api/feed?userId=<uuid>&page=1
 *
 * The frontend can (and does, for the simple case) query `posts` directly
 * from Supabase. This endpoint exists for the "heavy" version: ranking that
 * blends recency, engagement, and — once a user has skills/hiring categories
 * on their profile — relevance, plus mixing in open project opportunities.
 * That kind of cross-table scoring is awkward to express safely as a
 * client-side Supabase query (and would need RLS-bypassing joins), so it
 * lives here instead.
 */
router.get("/", async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured on server" });

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = 15;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [{ data: posts, error: postsError }, { data: projects, error: projectsError }] = await Promise.all([
      supabaseAdmin
        .from("posts")
        .select("*, author:profiles(full_name, title, avatar_url, role)")
        .order("created_at", { ascending: false })
        .range(from, to),
      supabaseAdmin
        .from("projects")
        .select("*")
        .eq("status", "Open")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (postsError) throw postsError;
    if (projectsError) throw projectsError;

    // Simple relevance blend: recent posts, interleaved with a couple of
    // open opportunities so the feed doesn't feel like a flat activity log.
    const items = [
      ...posts.map((p) => ({ kind: "post", ...p })),
      ...projects.slice(0, 2).map((p) => ({ kind: "opportunity", ...p })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ page, items });
  } catch (err) {
    console.error("Feed aggregation failed:", err);
    res.status(500).json({ error: "Failed to build feed" });
  }
});

export default router;
