import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { sampleProjects } from "../data/sampleData";
import { Card, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

export default function SubmitProposal({ session }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [bid, setBid] = useState("");
  const [days, setDays] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: project } = useSupabaseQuery(
    (sb) => sb.from("projects").select("*").eq("id", projectId).maybeSingle(),
    [projectId],
    sampleProjects.find((p) => p.id === projectId) || sampleProjects[0]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bid || !coverLetter.trim()) {
      setError("Add your bid and a short cover letter before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      if (supabase && session?.user?.id) {
        const { error: insertError } = await supabase.from("proposals").insert({
          project_id: projectId,
          freelancer_id: session.user.id,
          bid_amount: bid,
          delivery_days: days,
          cover_letter: coverLetter,
          status: "Under Review",
        });
        if (insertError) throw insertError;
      }
      navigate("/app/proposals");
    } catch (err) {
      console.error(err);
      setError("Unable to submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-[#0b1c30] md:text-[32px]">Submit a Proposal</h1>
      <p className="mb-6 text-sm text-[#565e74]">
        Applying to <span className="font-semibold text-[#0b1c30]">{project?.title}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#0b1c30]">Your Bid (fixed price)</label>
              <input
                value={bid}
                onChange={(e) => setBid(e.target.value)}
                placeholder="e.g. $1,200"
                className="w-full rounded-lg border border-[#c7c4d7] px-4 py-2.5 text-sm outline-none focus:border-[#4648d4] focus:ring-2 focus:ring-[#4648d4]/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#0b1c30]">Estimated Delivery</label>
              <input
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="e.g. 14 days"
                className="w-full rounded-lg border border-[#c7c4d7] px-4 py-2.5 text-sm outline-none focus:border-[#4648d4] focus:ring-2 focus:ring-[#4648d4]/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#0b1c30]">Cover Letter</label>
            <textarea
              rows={8}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Explain why you're a great fit for this project..."
              className="w-full resize-y rounded-lg border border-[#c7c4d7] px-4 py-3 text-sm leading-6 outline-none focus:border-[#4648d4] focus:ring-2 focus:ring-[#4648d4]/20"
            />
          </div>
          {error ? <p className="text-sm font-semibold text-[#ba1a1a]">{error}</p> : null}
        </Card>

        <div className="flex items-center gap-3">
          <PrimaryButton type="submit" disabled={submitting} className="px-6 py-3">
            {submitting ? "Submitting..." : "Submit Proposal"}
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
