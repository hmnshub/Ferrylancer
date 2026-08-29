import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { Card, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

export default function SubmitProposal({ session }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [bid, setBid] = useState("");
  const [days, setDays] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [links, setLinks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: project } = useSupabaseQuery(
    (sb) => sb.from("projects").select("*").eq("id", projectId).maybeSingle(),
    [projectId],
    null
  );
  const isOwner = project?.client_id === session?.user?.id;
  const isClosed = project?.application_deadline && new Date(`${project.application_deadline}T23:59:59`) < new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOwner) {
      setError("You cannot apply to your own project.");
      return;
    }
    if (isClosed) {
      setError("Applications are closed for this project.");
      return;
    }
    if (!bid || !coverLetter.trim()) {
      setError("Add your bid and a short cover letter before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      if (!supabase || !session?.user?.id) throw new Error("You must be signed in to submit a proposal.");
      const { data: applicantProfile, error: profileLookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profileLookupError) throw profileLookupError;
      if (!applicantProfile) {
        const { error: profileInsertError } = await supabase.from("profiles").insert({
          id: session.user.id,
          role: "freelancer",
          full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Ferrylance Member",
        });
        if (profileInsertError && profileInsertError.code !== "23505") throw profileInsertError;
      }
      const proposalPayload = {
        project_id: projectId,
        freelancer_id: session.user.id,
        bid_amount: `NPR ${bid.replace(/[^0-9,]/g, "")}`,
        delivery_days: days,
        cover_letter: coverLetter,
        proposal_links: links.split("\n").map((link) => link.trim()).filter(Boolean),
        status: "Under Review",
      };
      let { error: insertError } = await supabase.from("proposals").insert(proposalPayload);
      if (insertError && /proposal_links|schema cache|column .* does not exist/i.test(`${insertError.message} ${insertError.details || ""}`)) {
        const { proposal_links: _links, ...legacyPayload } = proposalPayload;
        const retry = await supabase.from("proposals").insert(legacyPayload);
        insertError = retry.error;
      }
      if (insertError) throw insertError;
      navigate("/app/proposals");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-[#050505] md:text-[32px]">Submit a Proposal</h1>
      <p className="mb-6 text-sm text-[#65676B]">
        Applying to <span className="font-semibold text-[#050505]">{project?.title}</span>
      </p>
      {project?.application_deadline ? <p className="mb-4 text-sm font-semibold text-[#9a5b00]">Applications close on {formatDate(project.application_deadline)}.</p> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#050505]">Your Bid (NPR)</label>
              <input
                value={bid}
                onChange={(e) => setBid(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 50000"
                className="w-full rounded-lg border border-[#D8DADF] px-4 py-2.5 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#050505]">Estimated Delivery</label>
              <input
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="e.g. 14 days"
                className="w-full rounded-lg border border-[#D8DADF] px-4 py-2.5 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#050505]">Cover Letter</label>
            <textarea
              rows={8}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Explain why you're a great fit for this project..."
              className="w-full resize-y rounded-lg border border-[#D8DADF] px-4 py-3 text-sm leading-6 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#050505]">Work links <span className="font-normal text-[#65676B]">(optional, one per line)</span></label>
            <textarea
              rows={3}
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="https://portfolio.example.com&#10;https://linkedin.com/in/your-profile"
              className="w-full resize-y rounded-lg border border-[#D8DADF] px-4 py-3 text-sm leading-6 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
            />
          </div>
          {error ? <p className="text-sm font-semibold text-[#ba1a1a]">{error}</p> : null}
        </Card>

        <div className="flex items-center gap-3">
          <PrimaryButton type="submit" disabled={submitting || isOwner || isClosed} className="px-6 py-3">
            {submitting ? "Submitting..." : isOwner ? "Project owner cannot apply" : isClosed ? "Applications closed" : "Submit Proposal"}
            <Icon className="text-[18px]">send</Icon>
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => navigate(-1)} className="px-6 py-3">
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
