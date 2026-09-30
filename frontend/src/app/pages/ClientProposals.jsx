import { NavLink } from "react-router-dom";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { Avatar, Badge, Card, EmptyState, Icon, PageHeader, PrimaryButton } from "../ui/primitives";

const STATUS_TONE = { "Under Review": "warning", Accepted: "success", Declined: "danger" };

export default function ClientProposals({ session }) {
  const userId = session?.user?.id || "";
  const { data: proposals = [], loading } = useSupabaseQuery(
    (sb) => sb
      .from("proposals")
      .select("id, project_id, freelancer_id, bid_amount, delivery_days, cover_letter, status, created_at, project:projects!inner(id, title, client_id), freelancer:profiles(id, full_name, title, avatar_url)")
      .eq("project.client_id", userId)
      .order("created_at", { ascending: false }),
    [userId],
    []
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Proposals received" description="See which Developers applied to each project you posted." />
      {loading ? null : !proposals.length ? (
        <EmptyState icon="inbox" title="No proposals received yet" description="When Developers apply to your projects, their proposals will appear here." action={<NavLink to="/app/projects"><PrimaryButton>View posted projects</PrimaryButton></NavLink>} />
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const freelancer = proposal.freelancer || {};
            return (
              <Card key={proposal.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#65676B]">Project</p>
                    <NavLink to={`/app/projects/${proposal.project_id}/responses`} className="mt-1 block text-lg font-bold text-[#050505] hover:text-[#1877F2]">{proposal.project?.title || "Posted project"}</NavLink>
                  </div>
                  <Badge tone={STATUS_TONE[proposal.status] || "neutral"}>{proposal.status}</Badge>
                </div>
                <div className="mt-4 flex flex-col gap-3 border-y border-[#E4E6EB] py-4 sm:flex-row sm:items-center sm:justify-between">
                  <NavLink to={`/app/profile/${freelancer.id}`} className="flex items-center gap-3"><Avatar src={freelancer.avatar_url} size={44} /><span><span className="block font-bold text-[#050505]">{freelancer.full_name || "Developer"}</span><span className="block text-xs text-[#65676B]">{freelancer.title || "Developer"}</span></span></NavLink>
                  <div className="flex gap-5 text-sm"><span><span className="block text-xs text-[#65676B]">Bid</span><strong>{proposal.bid_amount || "—"}</strong></span><span><span className="block text-xs text-[#65676B]">Delivery</span><strong>{proposal.delivery_days || "Flexible"}</strong></span></div>
                </div>
                <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-6 text-[#050505]">{proposal.cover_letter}</p>
                <NavLink to={`/app/projects/${proposal.project_id}/responses`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1877F2] hover:underline">Review all proposals <Icon className="text-[17px]">arrow_forward</Icon></NavLink>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
