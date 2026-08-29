import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { Card, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

export default function ProjectDetails({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: project, loading, error } = useSupabaseQuery(
    (sb) => sb.from("projects").select("*").eq("id", id).maybeSingle(),
    [id],
    null
  );

  if (loading) return <div className="rounded-2xl border border-[#D8DADF] bg-white p-8 text-center text-sm text-[#65676B]">Loading project…</div>;
  if (error) return <Card className="border-[#f3b5b5] bg-[#fff7f7] p-8"><Icon className="mb-3 text-3xl text-[#ba1a1a]">error_outline</Icon><h1 className="text-lg font-bold text-[#050505]">Unable to load this project</h1><p className="mt-2 text-sm text-[#65676B]">Supabase returned an error while opening this project. Refresh the page and try again.</p><p className="mt-3 text-xs text-[#ba1a1a]">{error.message || "Project query failed"}</p><SecondaryButton className="mt-5" onClick={() => navigate(-1)}>Go back</SecondaryButton></Card>;
  if (!project) return <Card className="p-8"><h1 className="text-lg font-bold text-[#050505]">Project not found</h1><SecondaryButton className="mt-5" onClick={() => navigate(-1)}>Go back</SecondaryButton></Card>;
  const isOwner = project.client_id === session?.user?.id;
  const responseCount = project.proposals || 0;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-[#65676B] hover:text-[#1877F2]">
        <Icon className="text-[18px]">arrow_back</Icon>
        Back to Search
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="mb-3 text-2xl font-bold leading-tight text-[#050505] md:text-[32px]">{project.title}</h1>
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-[#65676B]">
            <span className="flex items-center gap-1.5">
              <Icon className="text-[18px]">business</Icon>
              Client
            </span>
            <span className="flex items-center gap-1.5">
              <Icon className="text-[18px] text-[#f5a623]">star</Icon>
              4.9
            </span>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon="payments" label="Budget" value={project.budget} />
            <Stat icon="schedule" label="Est. Time" value={project.estimated_time || "Flexible"} />
            <Stat icon="event" label="Project deadline" value={formatDate(project.deadline) || "Flexible"} />
            <Stat icon="signal_cellular_alt" label="Level" value="Intermediate" />
          </div>

          <Card className="mb-6 p-6">
            <h2 className="mb-3 text-lg font-bold text-[#050505]">About the Project</h2>
            <p className="whitespace-pre-line text-sm leading-6 text-[#050505]">{project.description}</p>
          </Card>

          <Card className="mb-6 p-6">
            <h2 className="mb-3 text-lg font-bold text-[#050505]">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(project.tags || []).map((tag) => (
                <span key={tag} className="rounded-md bg-[#E7F3FF] px-3 py-1.5 text-xs font-semibold text-[#1877F2]">
                  {tag}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-bold text-[#050505]">About the Client</h2>
            <div className="text-sm font-semibold text-[#050505]">Client</div>
            <p className="mt-1 text-sm text-[#65676B]">
              {responseCount} proposal{responseCount === 1 ? "" : "s"} received so far.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#65676B]">
              <span className="flex items-center gap-1.5">
                <Icon className="text-[16px] text-[#0f7a44]">verified</Icon>
                Payment Verified
              </span>
              <span className="flex items-center gap-1.5">
                <Icon className="text-[16px]">history</Icon>
                Member since 2024
              </span>
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#65676B]">Fixed Price</div>
            <div className="mb-2 text-2xl font-bold text-[#050505]">{project.budget}</div>
            <p className="mb-5 text-sm text-[#65676B]">Applications close {formatDate(project.application_deadline) || "when the project is filled"}.</p>
            {isOwner ? (
              <NavLink to={`/app/projects/${project.id}/responses`} className="block">
                <PrimaryButton className="w-full justify-center py-3">View {responseCount} Response{responseCount === 1 ? "" : "s"}</PrimaryButton>
              </NavLink>
            ) : project.application_deadline && new Date(`${project.application_deadline}T23:59:59`) < new Date() ? (
              <p className="rounded-lg bg-[#fff4e5] px-3 py-2 text-sm font-semibold text-[#9a5b00]">Applications are closed for this project.</p>
            ) : (
              <NavLink to={`/app/proposals/new/${project.id}`} className="block">
                <PrimaryButton className="w-full justify-center py-3">Submit Proposal<Icon className="text-[18px]">arrow_forward</Icon></PrimaryButton>
              </NavLink>
            )}
            <SecondaryButton className="mt-2 w-full justify-center py-3">
              <Icon className="text-[18px]">bookmark_border</Icon>
              Save Project
            </SecondaryButton>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#D8DADF] bg-white p-3 text-center">
      <Icon className="text-[20px] text-[#1877F2]">{icon}</Icon>
      <div className="mt-1 text-sm font-bold text-[#050505]">{value}</div>
      <div className="text-xs text-[#65676B]">{label}</div>
    </div>
  );
}
