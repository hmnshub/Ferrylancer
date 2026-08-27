import { Router } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

/**
 * POST /api/notifications/dispatch
 * body: { userId, type, text }
 *
 * Creating a single notification row is a light task the frontend already
 * does directly via Supabase where relevant. This endpoint is the place to
 * grow "fan-out" behaviour later — e.g. one proposal submission notifying
 * the client, or one new project notifying every freelancer whose skills
 * match its tags — without touching the frontend again.
 */
router.post("/dispatch", requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured on server" });

    const { userId, type, text } = req.body || {};
    if (!userId || !type || !text) {
      return res.status(400).json({ error: "userId, type, and text are required" });
    }

    const { error } = await supabaseAdmin.from("notifications").insert({ user_id: userId, type, text });
    if (error) throw error;

    res.json({ ok: true });
  } catch (err) {
    console.error("Notification dispatch failed:", err);
    res.status(500).json({ error: "Notification dispatch failed" });
  }
});

/**
 * POST /api/notifications/mark-read
 * body: { ids: string[] }  — marks the given notification ids as read for the calling user.
 */
router.post("/mark-read", requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured on server" });
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: "ids[] is required" });

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ unread: false })
      .in("id", ids)
      .eq("user_id", req.user.id);
    if (error) throw error;

    res.json({ ok: true });
  } catch (err) {
    console.error("Mark-read failed:", err);
    res.status(500).json({ error: "Mark-read failed" });
  }
});

export default router;
