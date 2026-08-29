import { NavLink, useParams } from "react-router-dom";
import { PostCard } from "./Feed";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { Card, Icon, PageHeader } from "../ui/primitives";

export default function ProfilePosts({ session, profile: ownProfile }) {
  const { id } = useParams();
  const profileId = id || session?.user?.id;
  const { data: viewedProfile, loading: profileLoading } = useSupabaseQuery(
    (sb) => sb.from("profiles").select("*").eq("id", profileId || "").maybeSingle(),
    [profileId],
    null
  );
  const profile = viewedProfile || ownProfile;
  const { data: posts = [], loading: postsLoading, refetch: refetchPosts } = useSupabaseQuery(
    (sb) => profileId
      ? sb
          .from("posts")
          .select("*, author:profiles!posts_author_id_fkey(full_name, title, avatar_url)")
          .eq("author_id", profileId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    [profileId],
    []
  );

  const displayName = profile?.role === "client"
    ? profile?.company_name || profile?.full_name || "Ferrylance Client"
    : profile?.full_name || "Ferrylance Member";

  if (profileLoading || postsLoading) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`${displayName}'s posts`}
        description={`All posts shared by ${displayName}.`}
        actions={
          <NavLink to={id ? `/app/profile/${id}` : "/app/profile"} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3d3fc4] hover:underline">
            <Icon className="text-[18px]">arrow_back</Icon>
            Back to profile
          </NavLink>
        }
      />
      {posts.length ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} profile={profile} session={session} onPostUpdated={refetchPosts} />
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <Icon className="text-[42px] text-[#D8DADF]">article</Icon>
          <p className="mt-2 text-sm text-[#65676B]">{displayName} has not posted anything yet.</p>
        </Card>
      )}
    </div>
  );
}
