import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { sampleProjects } from "../data/sampleData";
import { Card, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: project, loading } = useSupabaseQuery(
    (sb) => sb.from("projects").select("*").eq("id", id).maybeSingle(),
    [id],
    sampleProjects.find((p) => p.id === id) || sampleProjects[0]
  );

  if (loading || !project) return null;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-[#565e74] hover:text-[#4648d4]">
        <Icon className="text-[18px]">arrow_back</Icon>
        Back to Search
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="mb-3 text-2xl font-bold leading-tight text-[#0b1c30] md:text-[32px]">{project.title}</h1>
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-[#565e74]">
            <span className="flex items-center gap-1.5">
              <Icon className="text-[18px]">business</Icon>
              {project.client}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon className="text-[18px] text-[#f5a623]">star</Icon>
              4.9
            </span>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <Stat icon="payments" label="Budget" value={project.budget} />
            <Stat icon="schedule" label="Timeline" value={project.deadline || "Flexible"} />
            <Stat icon="signal_cellular_alt" label="Level" value="Intermediate" />
          </div>

          <Card className="mb-6 p-6">
            <h2 className="mb-3 text-lg font-bold text-[#0b1c30]">About the Project</h2>
            <p className="whitespace-pre-line text-sm leading-6 text-[#464554]">{project.description}</p>
          </Card>

          <Card className="mb-6 p-6">
            <h2 className="mb-3 text-lg font-bold text-[#0b1c30]">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(project.tags || []).map((tag) => (
                <span key={tag} className="rounded bg-[#e5eeff] px-3 py-1.5 text-xs font-semibold text-[#0b1c30]">
                  {tag}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-bold text-[#0b1c30]">About the Client</h2>
            <div className="text-sm font-semibold text-[#0b1c30]">{project.client}</div>
            <p className="mt-1 text-sm text-[#565e74]">
              Posted {project.proposals ?? 0} proposals received so far. Verified business on Ferrylance.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#565e74]">
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
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#565e74]">Fixed Price</div>
            <div className="mb-5 text-2xl font-bold text-[#0b1c30]">{project.budget}</div>
            <NavLink to={`/app/proposals/new/${project.id}`} className="block">
              <PrimaryButton className="w-full justify-center py-3">
                Submit Proposal
                <Icon className="text-[18px]">arrow_forward</Icon>
              </PrimaryButton>
            </NavLink>
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

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#c7c4d7] bg-white p-3 text-center">
      <Icon className="text-[20px] text-[#4648d4]">{icon}</Icon>
      <div className="mt-1 text-sm font-bold text-[#0b1c30]">{value}</div>
      <div className="text-xs text-[#565e74]">{label}</div>
    </div>
  );
}
