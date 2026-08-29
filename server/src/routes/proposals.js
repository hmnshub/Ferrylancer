import { Router } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

/**
 * POST /api/proposals
 * body: { projectId, bidAmount, deliveryDays, coverLetter }
 *
 * The frontend can insert a proposal directly via Supabase (RLS allows a
 * freelancer to insert their own proposal). This endpoint is the "heavy"
 * version: it also increments the project's proposal counter and notifies
 * the client — two extra writes across tables the freelancer doesn't have
 * RLS permission to touch directly, so they're done here with the service
 * role instead.
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured on server" });

    const { projectId, bidAmount, deliveryDays, coverLetter } = req.body || {};
    if (!projectId || !bidAmount || !coverLetter) {
      return res.status(400).json({ error: "projectId, bidAmount, and coverLetter are required" });
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, client_id, title, proposals, application_deadline")
      .eq("id", projectId)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.client_id === req.user.id) return res.status(403).json({ error: "Project owners cannot apply to their own project" });
    if (project.application_deadline && project.application_deadline < new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ error: "Applications are closed for this project" });
    }

    const { data: proposal, error: insertError } = await supabaseAdmin
      .from("proposals")
      .insert({
        project_id: projectId,
        freelancer_id: req.user.id,
        bid_amount: bidAmount,
        delivery_days: deliveryDays,
        cover_letter: coverLetter,
        status: "Under Review",
      })
      .select()
      .single();
    if (insertError) throw insertError;

    await supabaseAdmin
      .from("projects")
      .update({ proposals: (project.proposals || 0) + 1 })
      .eq("id", projectId);

    if (project.client_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: project.client_id,
        type: "proposal",
        text: `You received a new proposal on "${project.title}".`,
      });
    }

    res.status(201).json(proposal);
  } catch (err) {
    console.error("Proposal submission failed:", err);
    res.status(500).json({ error: "Proposal submission failed" });
  }
});

export default router;
