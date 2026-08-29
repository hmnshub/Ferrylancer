import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { Badge, Card, EmptyState, PageHeader, PrimaryButton } from "../ui/primitives";

const STATUS_TONE = { Open: "success", "In Progress": "primary", Completed: "neutral", Closed: "danger" };

export default function MyProjects({ profile, session }) {
  const isClient = profile?.role === "client";
  const [searchParams] = useSearchParams();
  const selectedProjectId = searchParams.get("project");
  const [deletedIds, setDeletedIds] = useState([]);
  const [deleteError, setDeleteError] = useState("");
  const { data: projects = [], loading } = useSupabaseQuery(
    (sb) => {
      const query = sb.from("projects").select("*, proposal_rows:proposals(count)").order("created_at", { ascending: false });
      return isClient ? query.eq("client_id", session?.user?.id || "") : query.eq("hired_freelancer_id", session?.user?.id || "");
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
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) {
      setDeleteError(error.message || "Unable to delete this project.");
      return;
    }
    setDeletedIds((ids) => [...ids, project.id]);
  };

  return (
    <div>
      <PageHeader
        title="My Projects"
        description={isClient ? "Projects you've posted and are managing." : "Projects you're actively working on."}
        actions={
          isClient ? (
            <NavLink to="/app/create">
              <PrimaryButton>+ Post a Project</PrimaryButton>
            </NavLink>
          ) : null
        }
      />

      {deleteError ? <p className="mb-4 rounded-lg border border-[#f3b5b5] bg-[#fff1f1] px-3 py-2 text-sm font-semibold text-[#ba1a1a]">{deleteError}</p> : null}
      {loading ? null : !visibleProjects.length ? (
        <EmptyState
          icon="work_outline"
          title={isClient ? "You haven't posted any projects yet" : "No active projects yet"}
          description={isClient ? "Post your first project to start receiving proposals." : "Browse Discover to find your next project."}
          action={
            <NavLink to={isClient ? "/app/create" : "/app/discover"}>
              <PrimaryButton>{isClient ? "Post a Project" : "Find Work"}</PrimaryButton>
            </NavLink>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleProjects.map((project) => (
            <div key={project.id} id={`project-${project.id}`}>
              <Card className={`p-5 transition ${selectedProjectId === project.id ? "ring-2 ring-[#1877F2]" : ""}`}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <NavLink to={`/app/workspace/${project.id}`} className="font-bold text-[#050505] hover:text-[#1877F2]">
                  {project.title}
                </NavLink>
                <Badge tone={STATUS_TONE[project.status] || "neutral"}>{project.status}</Badge>
              </div>
              <p className="mb-3 line-clamp-2 text-sm text-[#65676B]">{project.description}</p>
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
              {!isClient && project.hired_freelancer_id ? (
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
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
