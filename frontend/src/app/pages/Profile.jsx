import { NavLink, useParams } from "react-router-dom";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { sampleFreelancerProfile } from "../data/sampleData";
import { Avatar, Card, ExternalLinkChip, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

export default function Profile({ session, profile: ownProfile }) {
  const { id } = useParams();
  const isOwnProfile = !id || id === session?.user?.id;

  const { data: viewedProfile, loading } = useSupabaseQuery(
    (sb) => sb.from("profiles").select("*").eq("id", id || session?.user?.id || "").maybeSingle(),
    [id, session?.user?.id],
    isOwnProfile ? ownProfile : sampleFreelancerProfile
  );

  const profile = viewedProfile || ownProfile || sampleFreelancerProfile;
  if (loading) return null;

  const isClient = profile?.role === "client";

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="mb-6 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-[#dae2fd] to-[#c0c1ff] sm:h-36" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar src={profile?.avatar_url} size={96} className="border-4 border-white shadow-sm" />
              <div className="pb-1">
                <h1 className="text-xl font-bold text-[#0b1c30] sm:text-2xl">
                  {isClient ? profile?.company_name || profile?.full_name : profile?.full_name || "Ferrylance Member"}
                </h1>
                <p className="text-sm text-[#565e74]">
                  {isClient ? `${profile?.contact_title || profile?.title || ""}${profile?.full_name ? ` · ${profile.full_name}` : ""}` : profile?.title}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-[#767586]">
                  <Icon className="text-[15px]">location_on</Icon>
                  {profile?.location || "Location not set"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isOwnProfile ? (
                <NavLink to="/app/onboarding">
                  <SecondaryButton>
                    <Icon className="text-[18px]">edit</Icon>
                    Edit Profile
                  </SecondaryButton>
                </NavLink>
              ) : (
                <>
                  <SecondaryButton>
                    <Icon className="text-[18px]">person_add</Icon>
                    Connect
                  </SecondaryButton>
                  <SecondaryButton>
                    <Icon className="text-[18px]">chat_bubble_outline</Icon>
                    Message
                  </SecondaryButton>
                  <PrimaryButton>
                    <Icon className="text-[18px]">{isClient ? "work" : "work_outline"}</Icon>
                    {isClient ? "View Projects" : "Hire"}
                  </PrimaryButton>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 text-base font-bold text-[#0b1c30]">About</h2>
            <p className="whitespace-pre-line text-sm leading-6 text-[#464554]">
              {profile?.about || (isOwnProfile ? "Add a short bio from your profile settings so people know what you do." : "No bio added yet.")}
            </p>
            {isClient && profile?.mission ? (
              <>
                <h3 className="mb-1 mt-4 text-sm font-bold text-[#0b1c30]">Mission</h3>
                <p className="text-sm leading-6 text-[#464554]">{profile.mission}</p>
              </>
            ) : null}
          </Card>

          {isClient ? (
            <Card className="p-6">
              <h2 className="mb-3 text-base font-bold text-[#0b1c30]">Business Details</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Detail label="Industry" value={profile?.industry} />
                <Detail label="Company Size" value={profile?.company_size} />
                <Detail label="Hiring Frequency" value={profile?.hiring_frequency} />
                <Detail label="Typical Budget" value={profile?.budget_range} />
              </dl>
              {profile?.hiring_categories?.length ? (
                <>
                  <h3 className="mb-2 mt-4 text-sm font-bold text-[#0b1c30]">Hiring For</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.hiring_categories.map((c) => (
                      <span key={c} className="rounded bg-[#e5eeff] px-2.5 py-1 text-xs font-semibold text-[#0b1c30]">
                        {c}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="mb-3 text-base font-bold text-[#0b1c30]">Core Skills</h2>
              <div className="flex flex-wrap gap-2">
                {(profile?.skills || sampleFreelancerProfile.skills).map((skill) => (
                  <span key={skill} className="rounded bg-[#e5eeff] px-2.5 py-1 text-xs font-semibold text-[#0b1c30]">
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {profile?.links?.length ? (
            <Card className="p-6">
              <h2 className="mb-3 text-base font-bold text-[#0b1c30]">Links</h2>
              <div className="flex flex-wrap gap-2">
                {profile.links.map((link) => (
                  <ExternalLinkChip key={link.id || link.url} link={link} />
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="grid grid-cols-2 divide-x divide-[#e5eeff] p-4 text-center">
            <div>
              <Icon className="text-[20px] text-[#4648d4]">task_alt</Icon>
              <div className="mt-1 text-lg font-bold text-[#0b1c30]">{isClient ? profile?.projects_posted ?? 0 : 45}</div>
              <div className="text-xs text-[#565e74]">{isClient ? "Posted" : "Projects"}</div>
            </div>
            <div>
              <Icon className="text-[20px] text-[#f5a623]">star</Icon>
              <div className="mt-1 text-lg font-bold text-[#0b1c30]">4.9</div>
              <div className="text-xs text-[#565e74]">Rating</div>
            </div>
          </Card>

          {!isClient ? (
            <Card className="p-5">
              <h3 className="mb-1 text-sm font-bold text-[#0b1c30]">Availability</h3>
              <p className="text-sm text-[#565e74]">{profile?.availability || "Not specified"}</p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#767586]">{label}</dt>
      <dd className="mt-0.5 font-semibold text-[#0b1c30]">{value || "—"}</dd>
    </div>
  );
}
