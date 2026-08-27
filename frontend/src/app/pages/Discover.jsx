import { useMemo, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { sampleProjects } from "../data/sampleData";
import { Badge, Card, EmptyState, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

const CATEGORIES = ["Design & Creative", "Web Development", "Mobile Apps", "Writing", "Marketing"];
const SORTS = ["Recommended", "Latest", "Most Relevant"];

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeCategories, setActiveCategories] = useState([]);
  const [sort, setSort] = useState("Recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: projects, loading } = useSupabaseQuery(
    (sb) => sb.from("projects").select("*").eq("status", "Open").order("created_at", { ascending: false }),
    [],
    sampleProjects
  );

  const toggleCategory = (cat) =>
    setActiveCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  const filtered = useMemo(() => {
    let list = projects;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (activeCategories.length) {
      list = list.filter((p) => (p.tags || []).some((tag) => activeCategories.some((c) => tag.toLowerCase().includes(c.split(" ")[0].toLowerCase()))));
    }
    if (sort === "Latest") {
      list = [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    return list;
  }, [projects, query, activeCategories, sort]);

  const submitSearch = (e) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0b1c30] md:text-[32px]">Find Work</h1>
        <p className="mt-1 text-sm text-[#565e74]">Discover projects that match your skills and experience.</p>
      </div>

      <form onSubmit={submitSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#565e74]">search</Icon>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects by title or keyword..."
            className="w-full rounded-lg border border-[#c7c4d7] bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#4648d4] focus:ring-2 focus:ring-[#4648d4]/20"
          />
        </div>
        <SecondaryButton type="button" className="lg:hidden" onClick={() => setFiltersOpen((v) => !v)}>
          <Icon className="text-[18px]">tune</Icon>
          Filters
        </SecondaryButton>
      </form>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <aside className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-[#0b1c30]">Filters</span>
              {activeCategories.length ? (
                <button onClick={() => setActiveCategories([])} className="text-xs font-semibold text-[#4648d4]">
                  Clear all
                </button>
              ) : null}
            </div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#565e74]">Category</div>
            <div className="flex flex-col gap-2 py-2">
              {CATEGORIES.map((cat) => (
                <label key={cat} className="flex items-center gap-2 text-sm text-[#0b1c30]">
                  <input
                    type="checkbox"
                    checked={activeCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="h-4 w-4 rounded border-[#c7c4d7] text-[#4648d4] focus:ring-[#4648d4]"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </Card>
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-[#565e74]">Showing {filtered.length} projects</span>
            <div className="flex gap-1 rounded-lg border border-[#c7c4d7] bg-white p-1">
              {SORTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    sort === s ? "bg-[#4648d4] text-white" : "text-[#565e74] hover:bg-[#eff4ff]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? null : filtered.length === 0 ? (
            <EmptyState icon="search_off" title="No projects match your filters" description="Try clearing filters or searching a different keyword." />
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProjectRow({ project }) {
  return (
    <Card className="p-5">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <NavLink to={`/app/projects/${project.id}`} className="text-base font-bold text-[#0b1c30] hover:text-[#4648d4]">
            {project.title}
          </NavLink>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#565e74]">
            <Icon className="text-[15px] text-[#4648d4]">verified</Icon>
            {project.client || "Verified Client"}
            <span>•</span>
            {project.status ? <Badge tone={project.status === "Open" ? "success" : "neutral"}>{project.status}</Badge> : null}
          </div>
        </div>
        <button className="text-[#565e74] hover:text-[#4648d4]">
          <Icon>favorite_border</Icon>
        </button>
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-[#464554]">{project.description}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {(project.tags || []).map((tag) => (
          <span key={tag} className="rounded bg-[#e5eeff] px-2.5 py-1 text-xs font-semibold text-[#0b1c30]">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5eeff] pt-3">
        <div className="flex flex-wrap gap-6 text-xs text-[#565e74]">
          <div>
            <div className="font-bold text-[#0b1c30]">{project.budget || "—"}</div>
            Budget
          </div>
          <div>
            <div className="font-bold text-[#0b1c30]">{project.deadline || "Flexible"}</div>
            Timeline
          </div>
          <div>
            <div className="font-bold text-[#0b1c30]">{project.proposals ?? 0}</div>
            Proposals
          </div>
        </div>
        <NavLink to={`/app/projects/${project.id}`}>
          <PrimaryButton>View Project</PrimaryButton>
        </NavLink>
      </div>
    </Card>
  );
}
