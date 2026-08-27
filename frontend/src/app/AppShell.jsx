import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Avatar, Icon } from "./ui/primitives";

const NAV_LINKS = [
  { to: "/app", label: "Home", icon: "home", end: true },
  { to: "/app/discover", label: "Discover", icon: "search" },
  { to: "/app/projects", label: "Projects", icon: "work" },
  { to: "/app/messages", label: "Messages", icon: "mail" },
];

const MOBILE_LINKS = [
  { to: "/app", label: "Home", icon: "home", end: true },
  { to: "/app/discover", label: "Discover", icon: "search" },
  { to: "/app/create", label: "Create", icon: "add_circle" },
  { to: "/app/messages", label: "Messages", icon: "mail" },
  { to: "/app/profile", label: "Profile", icon: "person" },
];

export default function AppShell({ session, profile }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const isClient = profile?.role === "client";

  const handleSearch = (event) => {
    event.preventDefault();
    if (query.trim()) navigate(`/app/discover?q=${encodeURIComponent(query.trim())}`);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-[76px] pt-[65px] text-[#0b1c30] md:pb-0">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .icon-fill { font-variation-settings: 'FILL' 1; }
      `}</style>

      {/* Top nav */}
      <header className="fixed top-0 z-50 w-full border-b border-[#c7c4d7] bg-[#f8f9ff]">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <NavLink to="/app" className="text-2xl font-bold tracking-tight text-[#4648d4]">
              Ferrylance
            </NavLink>
            <form onSubmit={handleSearch} className="relative hidden w-64 lg:block">
              <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#565e74]">search</Icon>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, people..."
                className="w-full rounded-full border border-[#c7c4d7] bg-white py-2 pl-10 pr-4 text-sm text-[#0b1c30] outline-none transition placeholder:text-[#565e74] focus:border-[#4648d4] focus:ring-2 focus:ring-[#4648d4]/20"
              />
            </form>
          </div>

          <nav className="hidden h-full items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex h-full items-center border-b-2 pt-1 text-sm font-medium transition-colors ${
                    isActive ? "border-[#4648d4] text-[#4648d4]" : "border-transparent text-[#565e74] hover:text-[#4648d4]"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <NavLink
              to="/app/notifications"
              className={({ isActive }) =>
                `flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-[#e5eeff] text-[#4648d4]" : "text-[#565e74] hover:bg-[#eff4ff] hover:text-[#4648d4]"
                }`
              }
            >
              <Icon>notifications</Icon>
            </NavLink>
            <div className="group relative ml-1">
              <NavLink to="/app/profile">
                <Avatar src={profile?.avatar_url} size={32} className="cursor-pointer border-[#c7c4d7] hover:border-[#4648d4]" />
              </NavLink>
              <div className="invisible absolute right-0 top-11 w-48 rounded-xl border border-[#c7c4d7] bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                <div className="px-3 py-2 text-xs text-[#565e74]">
                  Signed in as
                  <div className="truncate text-sm font-semibold text-[#0b1c30]">{session?.user?.email}</div>
                </div>
                <NavLink to="/app/onboarding" className="block rounded-lg px-3 py-2 text-sm text-[#0b1c30] hover:bg-[#eff4ff]">
                  Edit profile
                </NavLink>
                {isClient ? (
                  <NavLink to="/app/create" className="block rounded-lg px-3 py-2 text-sm text-[#0b1c30] hover:bg-[#eff4ff]">
                    Post a project
                  </NavLink>
                ) : (
                  <NavLink to="/app/earnings" className="block rounded-lg px-3 py-2 text-sm text-[#0b1c30] hover:bg-[#eff4ff]">
                    Earnings
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <ProfileReminderBanner profile={profile} />

      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-[#c7c4d7] bg-[#f8f9ff] px-2 py-2 shadow-lg md:hidden">
        {MOBILE_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center rounded-lg px-3 py-1 transition-all ${
                isActive ? "scale-90 bg-[#dae2fd] text-[#4648d4]" : "text-[#565e74]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon filled={isActive}>{link.icon}</Icon>
                <span className="mt-0.5 text-[11px] font-medium">{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function ProfileReminderBanner({ profile }) {
  if (!profile || profile.profile_completed) return null;
  const pct = estimateCompletion(profile);
  return (
    <div className="border-b border-[#c7c4d7] bg-[#eff4ff]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="flex items-center gap-2 text-[#0b1c30]">
          <Icon className="text-[18px] text-[#4648d4]">info</Icon>
          Your profile is {pct}% complete — finish it so people can find and trust you.
        </div>
        <NavLink
          to="/app/onboarding"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-[#4648d4] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3a3cc0] sm:self-auto"
        >
          Continue setup
          <Icon className="text-[15px]">arrow_forward</Icon>
        </NavLink>
      </div>
    </div>
  );
}

function estimateCompletion(profile) {
  const step = profile.onboarding_step || 1;
  const total = profile.role === "client" ? 6 : 8;
  return Math.min(95, Math.round((step / total) * 100));
}
