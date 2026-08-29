import { NavLink } from "react-router-dom";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { Badge, Card, EmptyState, PageHeader, PrimaryButton } from "../ui/primitives";

const STATUS_TONE = { "Under Review": "warning", Accepted: "success", Declined: "danger" };

export default function MyProposals({ session }) {
  const { data: proposals = [], loading } = useSupabaseQuery(
    (sb) =>
      sb
        .from("proposals")
        .select("*, project:projects(title, client)")
        .eq("freelancer_id", session?.user?.id || "")
        .order("created_at", { ascending: false }),
    [session?.user?.id],
    []
  );

  return (
    <div>
      <PageHeader title="My Proposals" description="Track every proposal you've sent and its current status." />

      {loading ? null : !proposals.length ? (
        <EmptyState
          icon="send"
          title="No proposals yet"
          description="Browse open projects and submit your first proposal."
          action={
            <NavLink to="/app/discover">
              <PrimaryButton>Find Work</PrimaryButton>
            </NavLink>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="hidden bg-[#eff4ff] text-xs uppercase tracking-wide text-[#565e74] sm:table-header-group">
              <tr>
                <th className="px-5 py-3 font-semibold">Project</th>
                <th className="px-5 py-3 font-semibold">Bid</th>
                <th className="px-5 py-3 font-semibold">Submitted</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5eeff]">
              {proposals.map((p) => {
                const title = p.project?.title || p.project;
                const client = p.project?.client || p.client;
                return (
                  <tr key={p.id} className="block px-5 py-4 sm:table-row sm:px-0 sm:py-0">
                    <td className="block px-0 py-1 font-semibold text-[#0b1c30] sm:table-cell sm:px-5 sm:py-4">
                      {title}
                      <div className="text-xs font-normal text-[#565e74]">{client}</div>
                    </td>
                    <td className="block px-0 py-1 text-[#0b1c30] sm:table-cell sm:px-5 sm:py-4">{p.bid_amount || p.bid}</td>
                    <td className="block px-0 py-1 text-[#565e74] sm:table-cell sm:px-5 sm:py-4">{p.submitted || timeAgo(p.created_at)}</td>
                    <td className="block px-0 py-2 sm:table-cell sm:px-5 sm:py-4">
                      <Badge tone={STATUS_TONE[p.status] || "neutral"}>{p.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return "—";
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
