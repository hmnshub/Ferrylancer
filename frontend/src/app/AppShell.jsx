import { useEffect, useMemo, useRef, useState } from "react";
import { getProfileCompletion } from "../lib/profileCompletion";
import { runBackgroundTask } from "../lib/backgroundTasks";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseQuery } from "./data/useSupabaseQuery";
import { Avatar, Icon } from "./ui/primitives";

const NAV_LINKS = [
  { to: "/app", label: "Home", icon: "home", end: true },
  { to: "/app/discover", label: "Discover", icon: "search" },
  { to: "/app/network", label: "Network", icon: "hub" },
  { to: "/app/projects", label: "Projects", icon: "work" },
  { to: "/app/messages", label: "Messages", icon: "mail" },
];

const MOBILE_LINKS = [
  { to: "/app", label: "Home", icon: "home", end: true },
  { to: "/app/discover", label: "Discover", icon: "search" },
  { to: "/app/network", label: "Network", icon: "hub" },
  { to: "/app/projects", label: "Projects", icon: "work" },
  { to: "/app/messages", label: "Messages", icon: "mail" },
];

export default function AppShell({ session, profile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isOnboarding = location.pathname === "/app/onboarding";
  const [query, setQuery] = useState("");
  const isClient = profile?.role === "client";
  const [searchFocused, setSearchFocused] = useState(false);
  const [history, setHistory] = useState([]);
  const searchRef = useRef(null);
  const profileMenuRef = useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [backgroundTasks, setBackgroundTasks] = useState([]);

  // Pending incoming connection requests — for the badge on "Network"
  const { data: pendingConnections = [] } = useSupabaseQuery(
    (sb) =>
      session?.user?.id
        ? sb
            .from("connections")
            .select("id")
            .eq("recipient_id", session.user.id)
            .eq("status", "pending")
        : Promise.resolve({ data: [], error: null }),
    [session?.user?.id],
    []
  );
  const pendingCount = pendingConnections?.length ?? 0;

  const { data: unreadMessageNotifications = [], refetch: refetchUnreadMessages } = useSupabaseQuery(
    (sb) => sb
      .from("notifications")
      .select("id")
      .eq("user_id", session?.user?.id || "")
      .eq("type", "message")
      .eq("unread", true),
    [session?.user?.id],
    []
  );
  const unreadMessageCount = unreadMessageNotifications.length;

  useEffect(() => {
    const timer = window.setInterval(() => refetchUnreadMessages(), 15000);
    return () => window.clearInterval(timer);
    // The query hook returns a new refetch function on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Searchable data for autocomplete
  const { data: searchProfiles = [] } = useSupabaseQuery(
    (sb) => sb.from("profiles").select("id, full_name, title, avatar_url, role, location").limit(50),
    [],
    []
  );
  const { data: searchProjects = [] } = useSupabaseQuery(
    (sb) => sb.from("projects").select("id, title").eq("status", "Open").limit(50),
    [],
    []
  );

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ferrylance_search_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch (_) { /* ignore */ }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const saveToHistory = (term) => {
    if (!term.trim()) return;
    const t = term.trim();
    const updated = [t, ...history.filter((x) => x !== t)].slice(0, 8);
    setHistory(updated);
    localStorage.setItem("ferrylance_search_history", JSON.stringify(updated));
  };

  const removeFromHistory = (e, term) => {
    e.stopPropagation();
    const updated = history.filter((x) => x !== term);
    setHistory(updated);
    localStorage.setItem("ferrylance_search_history", JSON.stringify(updated));
  };

  // Live suggestions based on query
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results = [];
    searchProfiles.forEach((p) => {
      if (
        p.full_name?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.role?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      ) {
        results.push({ type: "person", id: p.id, label: p.full_name || "User", sub: p.title || p.role, avatar: p.avatar_url });
      }
    });
    searchProjects.forEach((p) => {
      if (p.title?.toLowerCase().includes(q)) {
        results.push({ type: "project", id: p.id, label: p.title, sub: "Project" });
      }
    });
    return results.slice(0, 6);
  }, [query, searchProfiles, searchProjects]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (query.trim()) {
      saveToHistory(query);
      setSearchFocused(false);
      navigate(`/app/discover?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const pickSuggestion = (s) => {
    setSearchFocused(false);
    setQuery("");
    if (s.type === "person") {
      navigate(`/app/profile/${s.id}`);
    } else {
      navigate(`/app/projects/${s.id}`);
    }
  };

  const pickHistory = (term) => {
    setQuery(term);
    saveToHistory(term);
    setSearchFocused(false);
    navigate(`/app/discover?q=${encodeURIComponent(term)}`);
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    if (supabase) await supabase.auth.signOut();
    navigate("/");
  };

  const displayName = profile?.full_name || session?.user?.email?.split("@")[0] || "Ferrylance member";
  const accountTitle = isClient ? profile?.company_name || profile?.title || "Client account" : profile?.title || "Freelancer account";
  const accountType = isClient ? "Client account" : "Freelancer account";

  return (
    <div className={`min-h-screen text-[#050505] ${isOnboarding ? "bg-[#faf8ff]" : "bg-[#F0F2F5] pb-[76px] pt-[57px] md:pb-0"}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; background-color: #F0F2F5; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .icon-fill { font-variation-settings: 'FILL' 1; }
      `}</style>

      {/* Top nav */}
      {!isOnboarding ? <header className="fixed top-0 z-50 w-full border-b border-[#D8DADF] bg-white shadow-sm">
        <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <NavLink to="/app" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]" aria-label="Ferrylance home">
              <img src="/images/ferrylance-logo.svg" alt="Ferrylance" className="h-9 w-9" />
            </NavLink>
            <div ref={searchRef} className="relative hidden w-72 lg:block">
              <form onSubmit={handleSearch}>
                <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#65676B]">search</Icon>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Search projects, people..."
                  className="w-full rounded-full border border-[#D8DADF] bg-[#F0F2F5] py-2 pl-10 pr-4 text-sm text-[#050505] outline-none transition placeholder:text-[#65676B] focus:border-[#1877F2] focus:bg-white focus:ring-2 focus:ring-[#1877F2]/20"
                />
              </form>

              {/* Dropdown */}
              {searchFocused && (
                <div className="absolute left-0 top-[calc(100%+6px)] z-[100] w-80 overflow-hidden rounded-xl border border-[#D8DADF] bg-white shadow-xl">
                  {/* Live suggestions (when user is typing) */}
                  {query.trim() && suggestions.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[#8A8D91]">Suggestions</div>
                      {suggestions.map((s) => (
                        <button
                          key={`${s.type}-${s.id}`}
                          type="button"
                          onClick={() => pickSuggestion(s)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[#F0F2F5]"
                        >
                          {s.avatar ? (
                            <Avatar src={s.avatar} size={32} className="shrink-0 rounded-full" />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                              <Icon className="text-[16px]">{s.type === "person" ? "person" : "work"}</Icon>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-[#050505]">{s.label}</div>
                            <div className="truncate text-[11px] text-[#65676B]">{s.sub}</div>
                          </div>
                          <Icon className="shrink-0 text-[16px] text-[#8A8D91]">north_west</Icon>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* "Search for ..." row */}
                  {query.trim() && (
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="flex w-full items-center gap-3 border-t border-[#E4E6EB] px-4 py-2.5 text-left transition hover:bg-[#F0F2F5]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white">
                        <Icon className="text-[16px]">search</Icon>
                      </div>
                      <span className="text-sm font-semibold text-[#1877F2]">
                        Search for &ldquo;{query.trim()}&rdquo;
                      </span>
                    </button>
                  )}

                  {/* No results while typing */}
                  {query.trim() && suggestions.length === 0 && (
                    <div className="px-4 py-3 text-center text-xs text-[#65676B]">
                      No matching results &mdash; press Enter to search
                    </div>
                  )}

                  {/* Search history (when input is empty) */}
                  {!query.trim() && history.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-4 py-2">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#8A8D91]">Recent</span>
                        <button
                          type="button"
                          onClick={() => { setHistory([]); localStorage.removeItem("ferrylance_search_history"); }}
                          className="text-[11px] font-semibold text-[#1877F2] hover:underline"
                        >
                          Clear all
                        </button>
                      </div>
                      {history.map((term) => (
                        <div key={term} className="flex w-full items-center gap-3 px-4 py-2 transition hover:bg-[#F0F2F5]">
                          <button
                            type="button"
                            onClick={() => pickHistory(term)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                          <Icon className="shrink-0 text-[18px] text-[#65676B]">history</Icon>
                          <span className="flex-1 truncate text-sm text-[#050505]">{term}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => removeFromHistory(e, term)}
                            className="shrink-0 rounded-full p-0.5 text-[#8A8D91] hover:bg-[#E4E6EB] hover:text-[#050505]"
                            title="Remove"
                          >
                            <Icon className="text-[14px]">close</Icon>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {!query.trim() && history.length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-[#65676B]">
                      <Icon className="mb-1 text-[24px] text-[#D8DADF]">manage_search</Icon>
                      <p>Search for people, projects & more</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <nav className="hidden h-full items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `relative flex h-full items-center gap-1.5 border-b-2 pt-1 text-sm font-semibold transition-colors ${
                    isActive ? "border-[#1877F2] text-[#1877F2]" : "border-transparent text-[#65676B] hover:text-[#1877F2]"
                  }`
                }
              >
                <span>{link.label}</span>
                {link.to === "/app/messages" && unreadMessageCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1877F2] px-1 text-[11px] font-bold text-white">
                    {unreadMessageCount}
                  </span>
                )}
                {link.to === "/app/network" && pendingCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1877F2] px-1 text-[11px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <NavLink
              to="/app/notifications"
              className={({ isActive }) =>
                `flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-[#E7F3FF] text-[#1877F2]" : "bg-[#F0F2F5] text-[#050505] hover:bg-[#E4E6EB]"
                }`
              }
            >
              <Icon>notifications</Icon>
            </NavLink>
            <div ref={profileMenuRef} className="relative ml-1">
              <button type="button" onClick={() => setProfileMenuOpen((open) => !open)} aria-label="Open account menu" aria-expanded={profileMenuOpen} className={`rounded-full p-0.5 transition focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 ${profileMenuOpen ? "ring-2 ring-[#1877F2]" : ""}`}><Avatar src={profile?.avatar_url} size={36} className="cursor-pointer border border-[#D8DADF] hover:border-[#1877F2]" /></button>
              {profileMenuOpen ? <div className="absolute right-0 top-12 z-[100] w-[310px] overflow-hidden rounded-xl border border-[#D8DADF] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
                <div className="border-b border-[#E4E6EB] p-3"><NavLink to="/app/profile" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 rounded-lg p-2 hover:bg-[#F0F2F5]"><Avatar src={profile?.avatar_url} size={48} /><div className="min-w-0 flex-1"><div className="truncate text-[15px] font-bold">{displayName}</div><div className="truncate text-xs text-[#65676B]">{accountTitle}</div><div className="text-[11px] font-medium text-[#1877F2]">View your profile</div></div><Icon className="text-[#8A8D91]">chevron_right</Icon></NavLink></div>
                <div className="border-b border-[#E4E6EB] px-3 py-2"><div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#8A8D91]">Account</div><div className="px-2 py-1 text-xs text-[#65676B]"><span className="font-semibold text-[#050505]">{accountType}</span><div className="truncate">{session?.user?.email}</div></div><NavLink to="/app/onboarding" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-[#F0F2F5]"><Icon className="text-[#65676B]">edit_square</Icon>Edit profile</NavLink><NavLink to="/app/notifications" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-[#F0F2F5]"><Icon className="text-[#65676B]">notifications</Icon>Notifications</NavLink></div>
                <div className="border-b border-[#E4E6EB] px-3 py-2"><div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#8A8D91]">Workspace</div>{isClient ? <><NavLink to="/app/create" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-[#F0F2F5]"><Icon className="text-[#1877F2]">add_task</Icon>Post a project</NavLink><NavLink to="/app/projects" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-[#F0F2F5]"><Icon className="text-[#65676B]">work</Icon>Manage projects</NavLink></> : <><NavLink to="/app/discover" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-[#F0F2F5]"><Icon className="text-[#1877F2]">search</Icon>Find work</NavLink><NavLink to="/app/proposals" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-[#F0F2F5]"><Icon className="text-[#65676B]">description</Icon>My proposals</NavLink><NavLink to="/app/earnings" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-[#F0F2F5]"><Icon className="text-[#65676B]">account_balance_wallet</Icon>Earnings</NavLink></>}</div>
                <div className="p-3"><button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40"><Icon>logout</Icon>Sign out</button></div>
              </div> : null}
            </div>
          </div>
        </div>
      </header> : null}

      {!isOnboarding ? <ProfileReminderBanner profile={profile} /> : null}

      <main className={isOnboarding ? "w-full" : "mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8"}>
        <Outlet />
      </main>

      {backgroundTasks.length ? <BackgroundActivity tasks={backgroundTasks} /> : null}

      {/* Bottom nav (mobile) */}
      {!isOnboarding ? <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-[#D8DADF] bg-white px-2 py-2 shadow-lg md:hidden">
        {MOBILE_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center rounded-lg px-3 py-1 transition-all ${
                isActive ? "bg-[#E7F3FF] text-[#1877F2]" : "text-[#65676B]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon filled={isActive}>{link.icon}</Icon>
                  {link.to === "/app/messages" && unreadMessageCount > 0 && (
                    <span className="absolute -right-3 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1877F2] px-1 text-[10px] font-bold leading-none text-white">
                      {unreadMessageCount}
                    </span>
                  )}
                  {link.to === "/app/network" && pendingCount > 0 && (
                    <span className="absolute -right-3 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1877F2] px-1 text-[10px] font-bold leading-none text-white">
                      {pendingCount}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 text-[11px] font-medium">{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav> : null}
    </div>
  );
}

function ProfileReminderBanner({ profile }) {
  if (!profile || profile.profile_completed) return null;
  const pct = estimateCompletion(profile);
  return (
    <div className="border-b border-[#D8DADF] bg-[#E7F3FF]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="flex items-center gap-2 text-[#050505]">
          <Icon className="text-[18px] text-[#1877F2]">info</Icon>
          Your profile is {pct}% complete — finish it so people can find and trust you.
        </div>
        <NavLink
          to="/app/onboarding"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-[#1877F2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1465D8] sm:self-auto"
        >
          Continue setup
          <Icon className="text-[15px]">arrow_forward</Icon>
        </NavLink>
      </div>
    </div>
  );
}

function estimateCompletion(profile) {
  return getProfileCompletion(profile);
}


function BackgroundActivity({ tasks }) {
  return (
    <div className="fixed bottom-5 right-5 z-[120] w-[min(360px,calc(100vw-2rem))] space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="rounded-xl border border-[#D8DADF] bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,.16)]">
          <div className="flex items-center gap-2"><Icon className="text-[19px] text-[#1877F2]">{task.kind === "delete" ? "delete" : "cloud_upload"}</Icon><span className="min-w-0 flex-1 truncate text-xs font-semibold">{task.label}</span>{task.status === "working" ? <span className="text-[11px] font-bold text-[#1877F2]">{task.progress}%</span> : null}</div>
          {task.status === "working" ? <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E4E6EB]"><div className="h-full rounded-full bg-[#1877F2] transition-all duration-300" style={{ width: `${task.progress}%` }} /></div> : null}
        </div>
      ))}
    </div>
  );
}
