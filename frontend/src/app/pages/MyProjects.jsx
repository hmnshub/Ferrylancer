import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { runBackgroundTask } from "../../lib/backgroundTasks";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { Badge, Card, EmptyState, PageHeader, PrimaryButton } from "../ui/primitives";

const STATUS_TONE = { Open: "success", "In Progress": "primary", Completed: "neutral", Closed: "danger", "Under Review": "warning", Accepted: "success", Declined: "danger" };

export default function MyProjects({ profile, session }) {
  const isClient = profile?.role === "client";
  const [searchParams] = useSearchParams();
  const selectedProjectId = searchParams.get("project");
  const [deletedIds, setDeletedIds] = useState([]);
  const [deleteError, setDeleteError] = useState("");
  const { data: projects = [], loading } = useSupabaseQuery(
    (sb) => {
      if (isClient) {
        return sb.from("projects").select("*, proposal_rows:proposals(count)").eq("client_id", session?.user?.id || "").order("created_at", { ascending: false });
      }
      return sb.from("proposals")
        .select("project_id, status, bid_amount, delivery_days, created_at, project:projects(*)")
        .eq("freelancer_id", session?.user?.id || "")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => ({
          data: (data || []).filter((row) => row.project).map((row) => ({ ...row.project, proposal_status: row.status, proposal_bid: row.bid_amount, proposal_delivery_days: row.delivery_days, proposal_created_at: row.created_at })),
          error,
        }));
    },
    [session?.user?.id, isClient],
    []
  );

  const visibleProjects = projects.filter((project) => !deletedIds.includes(project.id));

  useEffect(() => {
    if (!selectedProjectId || loading) return;
    document.getElementById(`project-${selectedProjectId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedProjectId, loading]);

  const deleteProject = async (project) => {
    if (!window.confirm(`Delete “${project.title}”? This will also remove its proposals and cannot be undone.`)) return;
    setDeleteError("");
    setDeletedIds((ids) => [...ids, project.id]);
    runBackgroundTask({
      label: "Deleting project",
      kind: "delete",
      run: async () => {
        const { error } = await supabase.from("projects").delete().eq("id", project.id);
        if (error) throw error;
      },
    }).catch((error) => {
      setDeletedIds((ids) => ids.filter((id) => id !== project.id));
      setDeleteError(error.message || "Unable to delete this project.");
    });
  };

  return (
    <div>
      <PageHeader
        title="My Projects"
        description={isClient ? "Projects you've posted and are managing." : "Projects you've applied to and projects you're working on."}
        actions={
          isClient ? (
            <NavLink to="/app/create?mode=project">
              <PrimaryButton>+ Post a Project</PrimaryButton>
            </NavLink>
          ) : null
        }
      />

      {deleteError ? <p className="mb-4 rounded-lg border border-[#f3b5b5] bg-[#fff1f1] px-3 py-2 text-sm font-semibold text-[#ba1a1a]">{deleteError}</p> : null}
      {loading ? null : !visibleProjects.length ? (
        <EmptyState
          icon="work_outline"
          title={isClient ? "You haven't posted any projects yet" : "You haven't applied to any projects yet"}
          description={isClient ? "Post your first project to start receiving proposals." : "Browse Discover and submit a proposal to track it here."}
          action={
            <NavLink to={isClient ? "/app/create?mode=project" : "/app/discover"}>
              <PrimaryButton>{isClient ? "Post a Project" : "Find Work"}</PrimaryButton>
            </NavLink>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleProjects.map((project) => (
            <div key={project.id} id={`project-${project.id}`}>
              <Card className={`overflow-hidden border-white/80 bg-white/80 p-0 shadow-[0_14px_36px_rgba(26,54,93,.10)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(26,54,93,.16)] ${selectedProjectId === project.id ? "ring-2 ring-[#1877F2]" : ""}`}>
              <div className="p-5">
                <div className="mb-3 flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <NavLink to={isClient || project.hired_freelancer_id === session?.user?.id ? `/app/workspace/${project.id}` : `/app/projects/${project.id}`} className="font-bold leading-5 text-[#050505] hover:text-[#1877F2]">
                        {project.title}
                      </NavLink>
                      <Badge tone={STATUS_TONE[isClient ? project.status : (project.proposal_status || project.status)] || "neutral"}>{isClient ? project.status : (project.proposal_status || project.status)}</Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-[#65676B]">{project.description}</p>
                  </div>
                  {project.image_url ? (
                    <NavLink
                      to={isClient || project.hired_freelancer_id === session?.user?.id ? `/app/workspace/${project.id}` : `/app/projects/${project.id}`}
                      className="group relative h-[82px] w-[112px] shrink-0 overflow-hidden rounded-2xl border border-white/80 bg-[#E7F3FF] shadow-[0_6px_18px_rgba(24,119,242,.14)]"
                      aria-label={`Open ${project.title}`}
                    >
                      <img src={project.image_url} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-2 pb-1.5 pt-5 text-right text-[10px] font-bold text-white">View</span>
                    </NavLink>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(project.tags || []).map((tag) => (
                    <span key={tag} className="rounded-md bg-[#E7F3FF] px-2 py-0.5 text-xs font-semibold text-[#1877F2]">
                      {tag}
                    </span>
                  ))}
                </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#E4E6EB] pt-3 text-xs text-[#65676B]">
                <span className="font-bold text-[#050505]">{project.budget}</span>
                <span>Due {project.deadline}</span>
              </div>
              {!isClient && project.proposal_status ? (
                <div className="mt-4 rounded-xl border border-[#D8DADF] bg-[#F7F8FA] p-3">
                  <div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-[#050505]">Application status</span><strong className="capitalize text-[#1877F2]">{project.proposal_status}</strong></div>
                  {project.proposal_bid ? <p className="mt-1 text-xs text-[#65676B]">Your bid: {project.proposal_bid}{project.proposal_delivery_days ? ` · Delivery: ${project.proposal_delivery_days}` : ""}</p> : null}
                </div>
              ) : null}
              {!isClient && project.hired_freelancer_id === session?.user?.id ? (
                <div className="mt-4 rounded-xl border border-[#BFDBFE] bg-[#E7F3FF] p-3">
                  <div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-[#050505]">Accepted budget</span><strong className="text-[#1877F2]">{project.accepted_budget || project.budget}</strong></div>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#0f7a44]"><span className="h-2 w-2 rounded-full bg-[#0f7a44]" />Payment held in escrow</div>
                  <p className="mt-1 text-xs leading-5 text-[#65676B]">Released when the client confirms the work is completed.</p>
                </div>
              ) : null}
              {isClient && project.hired_freelancer_id ? (
                <div className="mt-4 rounded-xl border border-[#f1d48b] bg-[#fff9e9] p-3"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-[#050505]">Escrow</span><strong className="text-[#8a6a10]">{project.escrow_amount || project.accepted_budget || project.budget}</strong></div><p className="mt-1 text-xs text-[#8a6a10]">Held until work is marked complete.</p></div>
              ) : null}
              {isClient ? (
                <div className="mt-4 flex items-center gap-2">
                  <NavLink to={`/app/projects/${project.id}/responses`} className="flex flex-1 items-center justify-between rounded-lg bg-[#E7F3FF] px-3 py-2 text-sm font-semibold text-[#1877F2] hover:bg-[#D8EAFF]">
                  {project.proposal_rows?.[0]?.count || 0} response{project.proposal_rows?.[0]?.count === 1 ? "" : "s"}
                  <span>View responses →</span>
                  </NavLink>
                  <button type="button" onClick={() => deleteProject(project)} className="rounded-lg border border-[#f3b5b5] px-3 py-2 text-sm font-semibold text-[#ba1a1a] hover:bg-[#fff1f1]" title="Delete project">
                    Delete
                  </button>
                </div>
              ) : null}
              </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
