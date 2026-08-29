import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { Avatar, Badge, Card, EmptyState, Icon, PageHeader } from "../ui/primitives";

const STATUS_TONE = { "Under Review": "warning", Accepted: "success", Declined: "danger" };

export default function ProjectResponses({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hiringId, setHiringId] = useState(null);
  const [actionError, setActionError] = useState("");
  const { data: project } = useSupabaseQuery(
    (sb) => sb.from("projects").select("id, title, client_id").eq("id", id).maybeSingle(),
    [id],
    null
  );
  const { data: proposals = [], loading } = useSupabaseQuery(
    (sb) => sb.from("proposals").select("*, freelancer:profiles(id, full_name, title, avatar_url, location, about)").eq("project_id", id).order("created_at", { ascending: false }),
    [id],
    []
  );

  const hireFreelancer = async (proposal) => {
    if (!project || project.client_id !== session?.user?.id || !proposal.freelancer_id || !supabase) return;
    if (!window.confirm("Hire this freelancer? Their proposal will be accepted and a private chat will be created.")) return;
    setHiringId(proposal.id);
    setActionError("");
    try {
      const { error: proposalError } = await supabase.from("proposals").update({ status: "Accepted" }).eq("id", proposal.id).eq("project_id", id);
      if (proposalError) throw proposalError;

      const { error: projectError } = await supabase.from("projects").update({ status: "In Progress", hired_freelancer_id: proposal.freelancer_id, accepted_budget: proposal.bid_amount, escrow_amount: proposal.bid_amount, escrow_status: "Held" }).eq("id", id).eq("client_id", session.user.id);
      if (projectError) throw projectError;

      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .upsert({ participant_a: session.user.id, participant_b: proposal.freelancer_id, updated_at: new Date().toISOString() }, { onConflict: "participant_a,participant_b" })
        .select("id")
        .single();
      if (conversationError) throw conversationError;

      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: session.user.id,
        text: `You’ve been hired for “${project.title}”. Let’s get started!`,
      });
      if (messageError) throw messageError;

      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: proposal.freelancer_id,
        type: "message",
        text: `You were hired for “${project.title}”. Check your messages to get started.`,
      });
      if (notificationError) console.warn("Hire notification could not be created:", notificationError.message);
      navigate("/app/messages");
    } catch (error) {
      console.error("Hiring failed:", error);
      setActionError(error.message || "Unable to hire this freelancer right now.");
    } finally { setHiringId(null); }
  };

  if (project && project.client_id !== session?.user?.id) {
    return <EmptyState icon="lock" title="Client access required" description="Only the client who posted this project can view its responses." />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Project Responses" description={project ? `${proposals.length} freelancer${proposals.length === 1 ? "" : "s"} responded to ${project.title}.` : "Review freelancer proposals."} />
      {actionError ? <p className="mb-4 rounded-lg border border-[#f3b5b5] bg-[#fff1f1] px-3 py-2 text-sm font-semibold text-[#ba1a1a]">{actionError}</p> : null}
      {loading ? null : proposals.length === 0 ? (
        <EmptyState icon="inbox" title="No proposals yet" description="Freelancer applications will appear here as they are submitted." />
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const freelancer = proposal.freelancer || {};
            return (
              <Card key={proposal.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <Avatar src={freelancer.avatar_url} size={52} />
                    <div className="min-w-0">
                      <NavLink to={`/app/profile/${freelancer.id}`} className="text-base font-bold text-[#050505] hover:text-[#1877F2]">{freelancer.full_name || "Freelancer"}</NavLink>
                      <p className="truncate text-sm text-[#65676B]">{freelancer.title || freelancer.location || "Freelancer"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={STATUS_TONE[proposal.status] || "neutral"}>{proposal.status}</Badge>
                    {proposal.status !== "Accepted" ? <button type="button" onClick={() => hireFreelancer(proposal)} disabled={hiringId === proposal.id} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1877F2] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1465D8] disabled:opacity-60">{hiringId === proposal.id ? "Hiring…" : "Hire"}<Icon className="text-[16px]">handshake</Icon></button> : null}
                    <NavLink to={`/app/profile/${freelancer.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8DADF] px-3 py-2 text-xs font-semibold text-[#050505] hover:bg-[#F0F2F5]">
                      View profile <Icon className="text-[16px]">arrow_forward</Icon>
                    </NavLink>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 border-y border-[#E4E6EB] py-3 text-sm sm:grid-cols-2">
                  <div><span className="text-[#65676B]">Bid: </span><strong>{proposal.bid_amount}</strong></div>
                  <div><span className="text-[#65676B]">Delivery: </span><strong>{proposal.delivery_days || "Not specified"}</strong></div>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#050505]">{proposal.cover_letter}</p>
                {proposal.proposal_links?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {proposal.proposal_links.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-[#D8DADF] px-3 py-1.5 text-xs font-semibold text-[#1877F2] hover:bg-[#E7F3FF]"><Icon className="text-[15px]">link</Icon>{link}</a>)}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
