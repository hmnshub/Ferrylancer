import { NavLink } from "react-router-dom";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { sampleProjects } from "../data/sampleData";
import { Badge, Card, EmptyState, PageHeader, PrimaryButton } from "../ui/primitives";

const STATUS_TONE = { Open: "success", "In Progress": "primary", Completed: "neutral", Closed: "danger" };

export default function MyProjects({ profile }) {
  const isClient = profile?.role === "client";
  const { data: projects, loading } = useSupabaseQuery(
    (sb) => sb.from("projects").select("*").order("created_at", { ascending: false }),
    [],
    sampleProjects
  );

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

      {loading ? null : !projects.length ? (
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
          {projects.map((project) => (
            <Card key={project.id} className="p-5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <NavLink to={`/app/workspace/${project.id}`} className="font-bold text-[#0b1c30] hover:text-[#4648d4]">
                  {project.title}
                </NavLink>
                <Badge tone={STATUS_TONE[project.status] || "neutral"}>{project.status}</Badge>
              </div>
              <p className="mb-3 line-clamp-2 text-sm text-[#565e74]">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {(project.tags || []).map((tag) => (
                  <span key={tag} className="rounded bg-[#e5eeff] px-2 py-0.5 text-xs font-semibold text-[#0b1c30]">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#e5eeff] pt-3 text-xs text-[#565e74]">
                <span className="font-bold text-[#0b1c30]">{project.budget}</span>
                <span>Due {project.deadline}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
