import { useMemo, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { Avatar, Badge, Card, EmptyState, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

const CATEGORIES = ["Design & Creative", "Web Development", "Mobile Apps", "Writing", "Marketing"];
const SORTS = ["Recommended", "Latest", "Most Relevant"];

export default function Discover({ session, profile: ownProfile }) {
  const userId = session?.user?.id ?? "";
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeCategories, setActiveCategories] = useState([]);
  const [sort, setSort] = useState("Recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "projects"); // "projects" | "people"

  // 1. Sync query/tab state when URL searchParams change (handles searching from header)

  // 1. Fetch Projects
  const { data: projects = [], loading: loadingProjects } = useSupabaseQuery(
    (sb) => sb.from("projects").select("*").eq("status", "Open").order("created_at", { ascending: false }),
    [],
    []
  );

  // 2. Fetch People (Profiles)
  const { data: people = [], loading: loadingPeople, refetch: refetchPeople } = useSupabaseQuery(
    (sb) =>
      userId
        ? sb
            .from("profiles")
            .select("id, full_name, title, avatar_url, location, role")
            .neq("id", userId)
            .limit(100)
        : sb
            .from("profiles")
            .select("id, full_name, title, avatar_url, location, role")
            .limit(100),
    [userId],
    []
  );

  // 3. Fetch Connections
  const { data: connections = [], refetch: refetchConnections } = useSupabaseQuery(
    (sb) =>
      userId
        ? sb
            .from("connections")
            .select("id, requester_id, recipient_id, status")
            .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        : Promise.resolve({ data: [], error: null }),
    [userId],
    []
  );

  const toggleCategory = (cat) =>
    setActiveCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  // Filter projects
  const filteredProjects = useMemo(() => {
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

  // Filter people
  const filteredPeople = useMemo(() => {
    let list = people;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.role?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [people, query]);

  const submitSearch = (e) => {
    e.preventDefault();
    setSearchParams(query ? { q: query, tab: activeTab } : { tab: activeTab });
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams(query ? { q: query, tab: tabName } : { tab: tabName });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#050505] md:text-[32px]">Discover</h1>
          <p className="mt-1 text-sm text-[#65676B]">Find work opportunities or build your network.</p>
        </div>

        {/* Tab selection */}
        <div className="flex rounded-xl bg-white p-1 border border-[#E4E6EB] self-start sm:self-auto shadow-sm">
          <button
            onClick={() => handleTabChange("projects")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "projects" ? "bg-[#1877F2] text-white shadow-sm" : "text-[#65676B] hover:bg-[#F0F2F5]"
            }`}
          >
            <Icon className="text-[16px]">work</Icon>
            Projects ({filteredProjects.length})
          </button>
          <button
            onClick={() => handleTabChange("people")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "people" ? "bg-[#1877F2] text-white shadow-sm" : "text-[#65676B] hover:bg-[#F0F2F5]"
            }`}
          >
            <Icon className="text-[16px]">people</Icon>
            People ({filteredPeople.length})
          </button>
        </div>
      </div>

      <form onSubmit={submitSearch} className="mb-5 flex gap-2">
        <div className="relative flex-1">
          <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#65676B]">search</Icon>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={activeTab === "projects" ? "Search projects by title, description or keyword..." : "Search people by name, title, role or location..."}
            className="w-full rounded-lg border border-[#D8DADF] bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
          />
        </div>
        {activeTab === "projects" && (
          <SecondaryButton type="button" className="lg:hidden" onClick={() => setFiltersOpen((v) => !v)}>
            <Icon className="text-[18px]">tune</Icon>
            Filters
          </SecondaryButton>
        )}
      </form>

      {activeTab === "projects" ? (
        // ─────────────────────────────────────────────────────────────────────────────
        // Projects Tab View
        // ─────────────────────────────────────────────────────────────────────────────
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <aside className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
            <Card className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-[#050505]">Filters</span>
                {activeCategories.length ? (
                  <button onClick={() => setActiveCategories([])} className="text-xs font-semibold text-[#1877F2]">
                    Clear all
                  </button>
                ) : null}
              </div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#65676B]">Category</div>
              <div className="flex flex-col gap-2 py-2">
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 text-sm text-[#050505]">
                    <input
                      type="checkbox"
                      checked={activeCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="h-4 w-4 rounded border-[#D8DADF] text-[#1877F2] focus:ring-[#1877F2]"
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </Card>
          </aside>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-[#65676B]">Showing {filteredProjects.length} projects</span>
              <div className="flex gap-1 rounded-lg border border-[#D8DADF] bg-white p-1">
                {SORTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      sort === s ? "bg-[#1877F2] text-white" : "text-[#65676B] hover:bg-[#F0F2F5]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loadingProjects ? null : filteredProjects.length === 0 ? (
              <EmptyState icon="search_off" title="No projects match your search" description="Try clearing filters or searching a different keyword." />
            ) : (
              <div className="flex flex-col gap-4">
                {filteredProjects.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        // ─────────────────────────────────────────────────────────────────────────────
        // People Tab View
        // ─────────────────────────────────────────────────────────────────────────────
        <section>
          {loadingPeople ? null : filteredPeople.length === 0 ? (
            <EmptyState icon="person_off" title="No members match your search" description="Try searching for a name, job title, or location." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPeople.map((person) => {
                const connRow = connections.find(
                  (c) => c.requester_id === person.id || c.recipient_id === person.id
                );
                const status = connRow?.status || null;
                const isRequester = connRow?.requester_id === userId;

                return (
                  <PeopleSearchCard
                    key={person.id}
                    person={person}
                    status={status}
                    isRequester={isRequester}
                    userId={userId}
                    ownProfile={ownProfile}
                    onRefetch={() => { refetchConnections(); refetchPeople(); }}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// People search card component
// ─────────────────────────────────────────────────────────────────────────────
function PeopleSearchCard({ person, status, isRequester, userId, ownProfile, onRefetch }) {
  const [loading, setLoading] = useState(false);

  const connect = async () => {
    if (status || loading) return;
    setLoading(true);
    const { error } = await supabase
      .from("connections")
      .insert({ requester_id: userId, recipient_id: person.id, status: "pending" });

    if (!error) {
      const myName = ownProfile?.full_name || "Someone";
      await supabase.from("notifications").insert({
        user_id: person.id,
        type: "connection",
        text: `${myName} sent you a connection request.`,
        meta: { requester_id: userId },
        unread: true,
      });
    }
    setLoading(false);
    onRefetch();
  };

  const withdraw = async () => {
    if (loading) return;
    setLoading(true);
    await supabase
      .from("connections")
      .delete()
      .or(`and(requester_id.eq.${userId},recipient_id.eq.${person.id}),and(requester_id.eq.${person.id},recipient_id.eq.${userId})`);
    setLoading(false);
    onRefetch();
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="h-12 bg-gradient-to-r from-[#1877F2]/20 to-[#E7F3FF]" />
      <div className="relative px-4 pb-4">
        <div className="absolute -top-6 left-4">
          <Avatar src={person.avatar_url} size={52} className="rounded-full border-2 border-white bg-white shadow-sm" />
        </div>
        <div className="pt-8">
          <NavLink to={`/app/profile/${person.id}`} className="block truncate text-sm font-bold text-[#050505] hover:underline">
            {person.full_name || "Unnamed User"}
          </NavLink>
          <p className="truncate text-xs text-[#65676B]">{person.title || person.role}</p>
          {person.location && (
            <p className="mt-0.5 flex items-center gap-0.5 truncate text-[11px] text-[#8A8D91]">
              <Icon className="text-[12px]">location_on</Icon>
              {person.location}
            </p>
          )}
        </div>

        <div className="mt-3">
          {status === "accepted" ? (
            <NavLink to={`/app/profile/${person.id}`} className="block">
              <SecondaryButton className="w-full text-xs">
                <Icon className="text-[14px]">chat</Icon>
                Message
              </SecondaryButton>
            </NavLink>
          ) : status === "pending" ? (
            isRequester ? (
              <button
                type="button"
                disabled={loading}
                onClick={withdraw}
                className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#1877F2] py-1.5 text-xs font-semibold text-[#1877F2] transition hover:bg-[#E7F3FF]"
              >
                <Icon className="text-[14px]">schedule</Icon>
                Pending · Withdraw
              </button>
            ) : (
              <NavLink to="/app/network" className="block">
                <PrimaryButton className="w-full text-xs">
                  Respond
                </PrimaryButton>
              </NavLink>
            )
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={connect}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#1877F2] py-1.5 text-xs font-semibold text-white transition hover:bg-[#1465D8]"
            >
              {loading ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Icon className="text-[14px]">person_add</Icon>
              )}
              Connect
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Row Component
// ─────────────────────────────────────────────────────────────────────────────
function ProjectRow({ project }) {
  return (
    <Card className="p-5">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <NavLink to={`/app/projects/${project.id}`} className="text-base font-bold text-[#050505] hover:text-[#1877F2]">
            {project.title}
          </NavLink>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#65676B]">
            <Icon className="text-[15px] text-[#1877F2]">verified</Icon>
            {project.client || "Verified Client"}
            <span>•</span>
            {project.status ? <Badge tone={project.status === "Open" ? "success" : "neutral"}>{project.status}</Badge> : null}
          </div>
        </div>
        <button className="text-[#65676B] hover:text-[#1877F2]">
          <Icon>favorite_border</Icon>
        </button>
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-[#65676B]">{project.description}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {(project.tags || []).map((tag) => (
          <span key={tag} className="rounded-md bg-[#E7F3FF] px-2.5 py-1 text-xs font-semibold text-[#1877F2]">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E6EB] pt-3">
        <div className="flex flex-wrap gap-6 text-xs text-[#65676B]">
          <div>
            <div className="font-bold text-[#050505]">{project.budget || "—"}</div>
            Budget
          </div>
          <div>
            <div className="font-bold text-[#050505]">{formatDate(project.application_deadline) || "Flexible"}</div>
            Apply by
          </div>
          <div>
            <div className="font-bold text-[#050505]">{project.proposals ?? 0}</div>
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

function formatDate(value) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
