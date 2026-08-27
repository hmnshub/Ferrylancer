import { NavLink } from "react-router-dom";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { samplePeople, samplePosts, sampleOpportunities, sampleRecommended, trendingSkills } from "../data/sampleData";
import { Avatar, Card, Icon, PrimaryButton } from "../ui/primitives";

export default function Feed({ profile }) {
  const { data: posts } = useSupabaseQuery(
    (sb) => sb.from("posts").select("*, author:profiles(full_name, title, avatar_url)").order("created_at", { ascending: false }).limit(20),
    [],
    samplePosts
  );

  const completion = profile ? estimateCompletion(profile) : 60;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT: mini profile + shortcuts */}
      <aside className="hidden flex-col gap-4 lg:flex lg:col-span-3">
        <Card className="overflow-hidden">
          <div className="h-20 w-full bg-gradient-to-r from-[#dae2fd] to-[#e5eeff]" />
          <div className="flex flex-col items-center px-6 pb-6 text-center">
            <Avatar src={profile?.avatar_url} size={64} className="-mt-8 border-4 border-white shadow-sm" />
            <h2 className="mt-3 text-base font-bold text-[#0b1c30]">{profile?.full_name || "Your Name"}</h2>
            <p className="mb-3 text-sm text-[#565e74]">{profile?.title || (profile?.role === "client" ? profile?.company_name : "Add your title")}</p>
            <div className="mb-1 flex items-center gap-1 text-xs text-[#565e74]">
              <Icon className="text-[16px]">location_on</Icon>
              {profile?.location || "Add location"}
            </div>
            <div className="mt-3 w-full">
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="text-[#565e74]">Profile Strength</span>
                <span className="text-[#4648d4]">{completion}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e5eeff]">
                <div className="h-full rounded-full bg-[#4648d4]" style={{ width: `${completion}%` }} />
              </div>
            </div>
            <NavLink to="/app/profile" className="mt-4 w-full rounded-lg border border-[#c7c4d7] py-2 text-sm font-semibold text-[#0b1c30] hover:bg-[#eff4ff]">
              View Profile
            </NavLink>
          </div>
        </Card>

        <Card className="p-4">
          <ul className="flex flex-col gap-1">
            <li>
              <NavLink to="/app/discover" className="group flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-[#0b1c30] hover:bg-[#eff4ff]">
                <Icon className="text-[#565e74] group-hover:text-[#4648d4]">bookmark</Icon>
                Saved Projects
              </NavLink>
            </li>
            <li>
              <NavLink to="/app/proposals" className="group flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-[#0b1c30] hover:bg-[#eff4ff]">
                <Icon className="text-[#565e74] group-hover:text-[#4648d4]">send</Icon>
                My Proposals
              </NavLink>
            </li>
          </ul>
        </Card>
      </aside>

      {/* CENTER: feed */}
      <section className="flex flex-col gap-4 lg:col-span-6">
        <Card className="p-6">
          <div className="mb-3 flex gap-3">
            <Avatar src={profile?.avatar_url} size={40} />
            <NavLink
              to="/app/create"
              className="flex flex-1 items-center rounded-full border border-[#c7c4d7] px-4 text-left text-sm text-[#565e74] hover:bg-[#eff4ff]"
            >
              Start a post...
            </NavLink>
          </div>
          <div className="flex flex-wrap items-center gap-1 border-t border-[#e5eeff] pt-3">
            <NavLink to="/app/create" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[#565e74] hover:bg-[#eff4ff]">
              <Icon className="text-[#4648d4]">edit_document</Icon>
              Share an update
            </NavLink>
            <NavLink to="/app/create" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[#565e74] hover:bg-[#eff4ff]">
              <Icon className="text-[#4648d4]">imagesmode</Icon>
              Showcase your work
            </NavLink>
            {profile?.role === "client" ? (
              <NavLink to="/app/create" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[#565e74] hover:bg-[#eff4ff]">
                <Icon className="text-[#4648d4]">work</Icon>
                Post a project
              </NavLink>
            ) : null}
          </div>
        </Card>

        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {sampleOpportunities.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} />
        ))}
      </section>

      {/* RIGHT: recommendations */}
      <aside className="hidden flex-col gap-4 lg:flex lg:col-span-3">
        <Card className="p-5">
          <h3 className="mb-3 text-base font-bold text-[#0b1c30]">Recommended Projects</h3>
          <div className="flex flex-col gap-3">
            {sampleRecommended.map((item, i) => (
              <NavLink
                key={item.id}
                to={`/app/projects/${item.id}`}
                className={`block ${i < sampleRecommended.length - 1 ? "border-b border-[#e5eeff] pb-3" : ""}`}
              >
                <h4 className="mb-1 text-sm font-semibold leading-tight text-[#0b1c30] hover:text-[#4648d4]">{item.title}</h4>
                <p className="mb-2 line-clamp-2 text-xs text-[#565e74]">{item.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded bg-[#e5eeff] px-2 py-0.5 text-[#0b1c30]">{item.type}</span>
                  <span className="font-bold text-[#0b1c30]">{item.price}</span>
                </div>
              </NavLink>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-base font-bold text-[#0b1c30]">People to Connect With</h3>
          <div className="flex flex-col gap-3">
            {samplePeople.map((person) => (
              <div key={person.id} className="flex items-center gap-3">
                <Avatar src={person.avatar} size={40} />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-[#0b1c30]">{person.name}</h4>
                  <p className="truncate text-xs text-[#565e74]">{person.title}</p>
                </div>
                <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c7c4d7] text-[#565e74] hover:border-[#4648d4] hover:text-[#4648d4]">
                  <Icon className="text-[18px]">person_add</Icon>
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-base font-bold text-[#0b1c30]">Trending Skills</h3>
          <div className="flex flex-wrap gap-2">
            {trendingSkills.map((skill) => (
              <span key={skill} className="rounded-full border border-[#c7c4d7] bg-white px-3 py-1.5 text-xs font-semibold text-[#0b1c30]">
                {skill}
              </span>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}

function PostCard({ post }) {
  const author = post.author || post.profiles || {};
  const name = author.full_name || post.author_name || "Ferrylance Member";
  const title = author.title || post.author_title || "";
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex gap-3">
          <Avatar src={author.avatar_url} size={48} />
          <div>
            <h3 className="text-base font-bold leading-tight text-[#0b1c30]">{name}</h3>
            {title ? <p className="text-sm text-[#565e74]">{title}</p> : null}
            <p className="mt-0.5 text-xs text-[#767586]">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        <button className="text-[#565e74] hover:text-[#0b1c30]">
          <Icon>more_horiz</Icon>
        </button>
      </div>
      <p className="mb-4 whitespace-pre-line text-sm leading-6 text-[#464554]">{post.content}</p>
      {post.image ? (
        <div className="mb-4 overflow-hidden rounded-lg border border-[#e5eeff]">
          <img src={post.image} alt="" className="h-64 w-full object-cover" />
        </div>
      ) : null}
      <div className="flex items-center gap-4 border-t border-[#e5eeff] pt-3">
        <button className="flex items-center gap-1.5 text-sm text-[#565e74] hover:text-[#4648d4]">
          <Icon className="text-[20px]">thumb_up</Icon>
          {post.likes ?? 0}
        </button>
        <button className="flex items-center gap-1.5 text-sm text-[#565e74] hover:text-[#0b1c30]">
          <Icon className="text-[20px]">chat_bubble</Icon>
          {post.comments ?? 0}
        </button>
        <button className="ml-auto flex items-center gap-1.5 text-sm text-[#565e74] hover:text-[#0b1c30]">
          <Icon className="text-[20px]">share</Icon>
          Share
        </button>
      </div>
    </Card>
  );
}

function OpportunityCard({ opportunity }) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[#c0c1ff] bg-[#eff4ff] p-6 pl-7 shadow-[0px_4px_12px_-4px_rgba(70,72,212,0.08)]">
      <div className="absolute left-0 top-0 h-full w-1 bg-[#4648d4]" />
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4648d4]">
        <Icon filled className="text-[16px]">campaign</Icon>
        Project Opportunity
      </div>
      <h3 className="mb-2 text-lg font-bold text-[#0b1c30]">{opportunity.title}</h3>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5 text-[#0b1c30]">
          <Icon className="text-[18px] text-[#565e74]">payments</Icon>
          Budget: <span className="font-bold">{opportunity.budget}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#0b1c30]">
          <Icon className="text-[18px] text-[#565e74]">schedule</Icon>
          Est. Time: {opportunity.estTime}
        </div>
      </div>
      <p className="mb-4 text-sm text-[#464554]">{opportunity.description}</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {opportunity.tags.map((tag) => (
          <span key={tag} className="rounded bg-[#d3e4fe] px-2.5 py-1 text-xs font-semibold text-[#0b1c30]">
            {tag}
          </span>
        ))}
      </div>
      <NavLink to={`/app/proposals/new/${opportunity.id}`}>
        <PrimaryButton>Apply Now</PrimaryButton>
      </NavLink>
    </article>
  );
}

function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function estimateCompletion(profile) {
  const step = profile.onboarding_step || 1;
  const total = profile.role === "client" ? 6 : 8;
  return profile.profile_completed ? 100 : Math.min(95, Math.round((step / total) * 100));
}
