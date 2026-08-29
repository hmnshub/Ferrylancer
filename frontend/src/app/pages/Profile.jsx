import { useRef, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { apiUpload } from "../../lib/apiClient";
import { supabase } from "../../lib/supabaseClient";
import { PostCard } from "./Feed";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { Avatar, Card, ExternalLinkChip, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

export default function Profile({ session, profile: ownProfile }) {
  const { id } = useParams();
  const isOwnProfile = !id || id === session?.user?.id;
  const coverInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState("");
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const { data: viewedProfile, loading, refetch } = useSupabaseQuery(
    (sb) => sb.from("profiles").select("*").eq("id", id || session?.user?.id || "").maybeSingle(),
    [id, session?.user?.id],
    null
  );
  const profile = viewedProfile || ownProfile;
  const isClient = profile?.role === "client";
  const profileId = profile?.id || id;
  const viewerId = session?.user?.id;
  const { data: posts = [], loading: postsLoading, refetch: refetchPosts } = useSupabaseQuery(
    (sb) => profileId
      ? sb
          .from("posts")
          .select("*, author:profiles!posts_author_id_fkey(full_name, title, avatar_url)")
          .eq("author_id", profileId)
          .order("created_at", { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [], error: null }),
    [profileId],
    []
  );
  const { data: connectionStats = [] , refetch: refetchConnections } = useSupabaseQuery(
    (sb) => profileId
      ? sb.from("connections").select("id").or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`).eq("status", "accepted")
      : Promise.resolve({ data: [], error: null }),
    [profileId],
    []
  );
  const { data: followerStats = [] , refetch: refetchFollowers } = useSupabaseQuery(
    (sb) => profileId
      ? sb.from("follows").select("follower_id").eq("following_id", profileId)
      : Promise.resolve({ data: [], error: null }),
    [profileId],
    []
  );
  const { data: connection = null, refetch: refetchRelationship } = useSupabaseQuery(
    async (sb) => {
      if (!viewerId || !profileId || viewerId === profileId) return { data: null, error: null };
      const outgoing = await sb.from("connections").select("id, requester_id, recipient_id, status").eq("requester_id", viewerId).eq("recipient_id", profileId).maybeSingle();
      if (outgoing.error) return outgoing;
      if (outgoing.data) return outgoing;
      return sb.from("connections").select("id, requester_id, recipient_id, status").eq("requester_id", profileId).eq("recipient_id", viewerId).maybeSingle();
    },
    [viewerId, profileId],
    null
  );
  const { data: follow = null, refetch: refetchFollow } = useSupabaseQuery(
    (sb) => viewerId && profileId && viewerId !== profileId
      ? sb.from("follows").select("follower_id").eq("follower_id", viewerId).eq("following_id", profileId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    [viewerId, profileId],
    null
  );
  const { data: ratings = [] } = useSupabaseQuery(
    (sb) => profileId
      ? sb.from("ratings").select("score").eq("rated_user_id", profileId).order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    [profileId],
    []
  );
  const ratingValue = ratings.length
    ? (ratings.reduce((sum, rating) => sum + Number(rating.score || 0), 0) / ratings.length).toFixed(1)
    : "—";
  const [actionError, setActionError] = useState("");

  const toggleConnection = async () => {
    if (!supabase || !viewerId || !profileId || viewerId === profileId) return;
    setActionError("");
    let result;
    if (!connection) {
      // Send connection request
      result = await supabase.from("connections").insert({ requester_id: viewerId, recipient_id: profileId, status: "pending" });
      if (!result.error) {
        const senderName = ownProfile?.full_name || "Someone";
        await supabase.from("notifications").insert({
          user_id: profileId,
          type: "connection",
          text: `${senderName} sent you a connection request.`,
          meta: { requester_id: viewerId },
          unread: true,
        });
      }
    } else if (connection.recipient_id === viewerId && connection.status === "pending") {
      // Accept incoming request
      result = await supabase.from("connections").update({ status: "accepted" }).eq("id", connection.id).select("id, status").maybeSingle();
      if (!result.error) {
        const accepterName = ownProfile?.full_name || "Someone";
        await supabase.from("notifications").insert({
          user_id: connection.requester_id,
          type: "connection",
          text: `${accepterName} accepted your connection request. You are now connected!`,
          meta: { accepter_id: viewerId },
          unread: true,
        });
      }
    } else {
      // Withdraw / remove connection
      result = await supabase.from("connections").delete().eq("id", connection.id);
    }
    if (result.error) setActionError(result.error.message);
    else if (result.data === null && connection?.status === "pending") setActionError("The connection request could not be updated. Refresh and try again.");
    await Promise.all([refetchConnections(), refetchRelationship()]);
  };

  const toggleFollow = async () => {
    if (!supabase || !viewerId || !profileId || viewerId === profileId) return;
    setActionError("");
    const result = follow
      ? await supabase.from("follows").delete().eq("follower_id", viewerId).eq("following_id", profileId)
      : await supabase.from("follows").insert({ follower_id: viewerId, following_id: profileId });
    if (result.error) setActionError(result.error.message);
    await Promise.all([refetchFollowers(), refetchFollow()]);
  };

  const declineConnection = async () => {
    // Silently decline / ignore an incoming connection request
    if (!supabase || !connection?.id) return;
    setActionError("");
    const { error } = await supabase.from("connections").delete().eq("id", connection.id);
    if (error) setActionError(error.message);
    await Promise.all([refetchConnections(), refetchRelationship()]);
  };


  const uploadCover = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !supabase || !session?.user?.id) return;
    setCoverUploading(true);
    setCoverError("");
    try {
      const { url } = await apiUpload(file, "cover");
      const { error } = await supabase.from("profiles").update({ cover_url: url, updated_at: new Date().toISOString() }).eq("id", session.user.id);
      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error("Cover upload failed:", error);
      setCoverError("Unable to save your cover photo. Make sure the server is running, then try again.");
    } finally {
      setCoverUploading(false);
      event.target.value = "";
    }
  };

  const openPhotoEditor = () => {
    setPhotoPreview(profile?.avatar_url || null);
    setPhotoZoom(1);
    setPhotoRotation(0);
    setPhotoError("");
    setPhotoOpen(true);
  };

  const choosePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoZoom(1);
    setPhotoRotation(0);
    setPhotoError("");
    event.target.value = "";
  };

  const saveProfilePhoto = async () => {
    if (!photoPreview || !supabase || !session?.user?.id) return;
    setPhotoSaving(true);
    setPhotoError("");
    try {
      const image = new Image();
      // The current avatar is hosted by Supabase Storage. Request CORS access
      // before assigning src, otherwise exporting the crop taints the canvas.
      image.crossOrigin = "anonymous";
      image.src = photoPreview;
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 800;
      const context = canvas.getContext("2d");
      context.translate(400, 400);
      context.rotate((photoRotation * Math.PI) / 180);
      const scale = Math.max(800 / image.width, 800 / image.height) * photoZoom;
      context.drawImage(image, -(image.width * scale) / 2, -(image.height * scale) / 2, image.width * scale, image.height * scale);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
      if (!blob) throw new Error("Unable to crop image");
      const { url } = await apiUpload(new File([blob], "profile-photo.webp", { type: "image/webp" }), "avatar");
      const { error } = await supabase.from("profiles").update({ avatar_url: url, updated_at: new Date().toISOString() }).eq("id", session.user.id);
      if (error) throw error;
      await refetch();
      setPhotoOpen(false);
    } catch (error) {
      console.error("Profile photo save failed:", error);
      setPhotoError("Unable to save this photo. Make sure the upload server is running and try again.");
    } finally { setPhotoSaving(false); }
  };

  const deleteProfilePhoto = async () => {
    if (!supabase || !session?.user?.id || !window.confirm("Remove your profile photo?")) return;
    setPhotoSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ avatar_url: null, updated_at: new Date().toISOString() }).eq("id", session.user.id);
      if (error) throw error;
      await refetch();
      setPhotoPreview(null);
    } catch (error) { setPhotoError(error.message || "Unable to remove your photo."); }
    finally { setPhotoSaving(false); }
  };

  if (loading) return null;
  const displayName = isClient
    ? profile?.company_name || profile?.full_name || "Ferrylance Client"
    : profile?.full_name || "Ferrylance Member";
  const subtitle = isClient
    ? [profile?.title, profile?.full_name].filter(Boolean).join(" · ") || "Hiring on Ferrylance"
    : profile?.title || profile?.short_intro || "Freelance professional";

  const profileStrength = Math.min(100, [profile?.full_name, profile?.title, profile?.location, profile?.about, profile?.avatar_url, profile?.cover_url].filter(Boolean).length * 16);

  return (
    <div className="mx-auto max-w-[1280px] scroll-mt-36 px-0 pt-3 sm:pt-1">
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="min-w-0">
      <Card className="mb-4 overflow-visible rounded-2xl border border-[#dce6ff] bg-white shadow-[0_14px_36px_-24px_rgba(20,32,90,.45)] sm:mb-5">
        {/* Cover */}
        <div className="relative z-0 h-32 overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#0c1c42] via-[#2c47b0] to-[#7d9bf5] sm:h-48">
          {profile?.cover_url ? <img src={profile.cover_url} alt="" className="h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,.32),transparent_30%),radial-gradient(circle_at_85%_8%,rgba(255,255,255,.22),transparent_26%)]" />
          {/* signature gold seam */}
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-[#c9911a] via-[#f2c15c] to-[#c9911a]" />
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-60 sm:px-3.5 sm:py-2"
            >
              <Icon className="text-[15px] sm:text-[16px]">photo_camera</Icon>
              <span className="hidden sm:inline">{coverUploading ? "Uploading…" : profile?.cover_url ? "Change cover" : "Add cover photo"}</span>
            </button>
          ) : null}
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={uploadCover} />
        </div>

        <div className="relative z-10 px-4 pb-5 pt-32 sm:px-6 sm:pb-7 sm:pt-32">
          <div className="absolute -top-16 left-4 z-20 sm:-top-16 sm:left-6">
              <div className="relative z-20 shrink-0">
              <button type="button" onClick={openPhotoEditor} className="group relative rounded-full focus:outline-none focus:ring-4 focus:ring-[#8da7f5]/50" aria-label="View profile photo">
                <Avatar src={profile?.avatar_url} size={176} className="shrink-0 rounded-full border-[5px] border-white bg-[#d3e4fe] shadow-lg" />
                {isOwnProfile ? <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white transition group-hover:bg-black/35"><Icon className="text-[22px] opacity-0 group-hover:opacity-100">photo_camera</Icon></span> : null}
              </button>
              </div>
          </div>
          <div className="max-w-2xl">
            <h1 className="text-xl font-extrabold tracking-tight text-[#0b1c30] sm:text-2xl">{displayName}</h1>
            <p className="mt-1 text-sm leading-5 text-[#565e74] sm:text-base">{subtitle}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-[#767586]"><Icon className="text-[15px]">location_on</Icon>{profile?.location || "Location not set"}<span className="mx-1 text-[#c9911a]">·</span><span className="font-semibold text-[#3d3fc4]">Contact info</span></p>
            <p className="mt-2 text-sm font-semibold text-[#3d3fc4]">{isClient ? `${profile?.projects_posted ?? 0} projects posted` : "Available for projects"}</p>
          </div>

          <div className="mt-4">
            <ProfileActions isOwnProfile={isOwnProfile} isClient={isClient} viewerId={viewerId} connection={connection} follow={follow} onConnect={toggleConnection} onFollow={toggleFollow} onIgnore={declineConnection} />

          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#e7edff] pt-4 sm:mt-5 sm:gap-x-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1.5 text-xs font-semibold text-[#3d3fc4] sm:text-sm">
              <Icon className="text-[16px] sm:text-[18px]">groups</Icon>
              {connectionStats.length} connections
            </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1.5 text-xs font-semibold text-[#3d3fc4] sm:text-sm"><Icon className="text-[16px] sm:text-[18px]">person_add</Icon>{followerStats.length} followers</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf6e6] px-3 py-1.5 text-xs font-semibold text-[#8a6a10] sm:text-sm">
              <Icon className="text-[16px] text-[#c9911a] sm:text-[18px]">verified</Icon>
              Profile on Ferrylance
            </span>
          </div>

          {coverError ? (
            <p className="mt-4 rounded-lg bg-[#fff1f1] px-3 py-2 text-sm font-semibold text-[#ba1a1a]">{coverError}</p>
          ) : null}
        </div>
      </Card>

        <div className="space-y-4 sm:space-y-5">
           <Card className="rounded-2xl border border-[#dce6ff] bg-white p-4 shadow-[0_8px_22px_-18px_rgba(20,32,90,.5)] sm:p-6">
             <SectionTitle icon="person" title="About" />
            <p className="whitespace-pre-line text-[13px] leading-6 text-[#464554] sm:text-sm">
              {profile?.about || (isOwnProfile ? "Add a short bio from Edit Profile so people know what you do." : "No bio added yet.")}
            </p>
            {isClient && profile?.mission ? (
              <>
                <h3 className="mb-1 mt-5 text-sm font-bold text-[#0b1c30]">Our mission</h3>
                <p className="text-[13px] leading-6 text-[#464554] sm:text-sm">{profile.mission}</p>
              </>
             ) : null}
           </Card>

           <section>
             <div className="mb-3 flex items-center justify-between px-1">
               <h2 className="flex items-center gap-2 text-base font-extrabold text-[#0b1c30] sm:text-lg">
                 <Icon className="text-[20px] text-[#3d3fc4]">article</Icon>
                 Latest posts
               </h2>
             </div>
             {postsLoading ? (
               <Card className="rounded-2xl border border-[#dce6ff] bg-white p-6 text-sm text-[#767586]">Loading posts…</Card>
             ) : posts.length ? (
               <div className="space-y-4">
                 {posts.map((post) => (
                   <PostCard key={post.id} post={post} profile={profile} session={session} onPostUpdated={refetchPosts} />
                 ))}
               </div>
             ) : (
               <Card className="rounded-2xl border border-[#dce6ff] bg-white p-6 text-sm text-[#767586]">
                 {isOwnProfile ? "Your latest posts will appear here." : "No posts yet."}
               </Card>
             )}
             {!postsLoading && posts.length > 0 ? (
               <NavLink
                 to={isOwnProfile ? "/app/profile/posts" : `/app/profile/${profileId}/posts`}
                 className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-[#dce6ff] bg-white px-4 py-3 text-sm font-bold text-[#3d3fc4] shadow-[0_8px_22px_-18px_rgba(20,32,90,.5)] hover:bg-[#f4f6ff]"
               >
                 See all posts
                 <Icon className="text-[18px]">arrow_forward</Icon>
               </NavLink>
             ) : null}
           </section>

           {isClient ? (
            <Card className="rounded-2xl border border-[#dce6ff] bg-white p-4 shadow-[0_8px_22px_-18px_rgba(20,32,90,.5)] sm:p-6">
              <SectionTitle icon="business" title="Business details" />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm sm:gap-x-5 sm:gap-y-5">
                <Detail label="Industry" value={profile?.industry} />
                <Detail label="Company size" value={profile?.company_size} />
                <Detail label="Hiring frequency" value={profile?.hiring_frequency} />
                <Detail label="Typical budget" value={profile?.budget_range} />
              </dl>
              {profile?.hiring_categories?.length ? (
                <>
                  <h3 className="mb-2 mt-5 text-sm font-bold text-[#0b1c30]">Hiring for</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.hiring_categories.map((category) => <Tag key={category}>{category}</Tag>)}
                  </div>
                </>
              ) : null}
            </Card>
          ) : (
            <Card className="rounded-2xl border border-[#dce6ff] bg-white p-4 shadow-[0_8px_22px_-18px_rgba(20,32,90,.5)] sm:p-6">
              <SectionTitle icon="auto_awesome" title="Skills" />
              <div className="flex flex-wrap gap-2">
                {(profile?.skills || []).map((skill) => <Tag key={skill}>{skill}</Tag>)}
              </div>
            </Card>
          )}

          {profile?.links?.length ? (
            <Card className="rounded-2xl border border-[#dce6ff] bg-white p-4 shadow-[0_8px_22px_-18px_rgba(20,32,90,.5)] sm:p-6">
              <SectionTitle icon="link" title="Links" />
              <div className="flex flex-wrap gap-2">
                {profile.links.map((link) => <ExternalLinkChip key={link.id || link.url} link={link} />)}
              </div>
            </Card>
          ) : null}
        </div>
        </div>

        <aside className="space-y-4 sm:space-y-5 xl:sticky xl:top-20">
          <Card className="grid grid-cols-2 gap-2 rounded-2xl border border-[#dce6ff] bg-gradient-to-br from-white to-[#f2f6ff] p-3 text-center shadow-[0_8px_22px_-18px_rgba(20,32,90,.5)] sm:grid-cols-4 sm:gap-3 sm:p-4">
            <Metric icon="task_alt" value={isClient ? profile?.projects_posted ?? 0 : 45} label={isClient ? "Projects posted" : "Projects"} />
            <Metric icon="groups" value={connectionStats.length} label="Connections" />
            <Metric icon="person_add" value={followerStats.length} label="Followers" />
            <Metric icon="star" value={ratingValue} label="Rating" accent="text-[#c9911a]" />
          </Card>

          {isOwnProfile ? (
            <Card className="rounded-2xl border border-[#cfdcff] bg-gradient-to-br from-[#f3f6ff] to-[#eef3ff] p-4 sm:p-5">
              <SectionTitle icon="insights" title="Profile strength" />
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#0b1c30]">{profileStrength}% complete</span>
                <span className="font-semibold text-[#3d3fc4]">{profileStrength === 100 ? "Complete" : "Keep going"}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3d3fc4] to-[#c9911a] transition-[width] duration-500"
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-[#565e74]">Add your photo, cover, headline, and bio to help the right people find you.</p>
              <NavLink to="/app/onboarding" className="mt-4 inline-flex items-center text-sm font-semibold text-[#3d3fc4] hover:underline">
                Improve profile <Icon className="ml-1 text-[17px]">arrow_forward</Icon>
              </NavLink>
            </Card>
          ) : null}

          {!isClient ? (
            <Card className="rounded-2xl border border-[#dce6ff] bg-white p-4 sm:p-5">
              <SectionTitle icon="schedule" title="Availability" />
              <p className="text-sm text-[#565e74]">{profile?.availability || "Not specified"}</p>
            </Card>
          ) : null}

          <Card className="rounded-2xl border border-[#dce6ff] bg-white p-4 sm:p-5">
            <SectionTitle icon="visibility" title="Profile visibility" />
            <p className="text-sm leading-6 text-[#565e74]">Your profile is visible to Ferrylance members looking for the right fit.</p>
            {isOwnProfile ? (
              <NavLink to="/app/onboarding" className="mt-3 inline-flex items-center text-sm font-semibold text-[#3d3fc4] hover:underline">
                Manage profile <Icon className="ml-1 text-[17px]">arrow_forward</Icon>
              </NavLink>
            ) : null}
          </Card>
        </aside>
      </div>
      {actionError ? <p className="mt-3 text-sm font-semibold text-[#ba1a1a]">{actionError}</p> : null}
      {photoOpen ? <PhotoModal preview={photoPreview} editable={isOwnProfile} inputRef={photoInputRef} zoom={photoZoom} rotation={photoRotation} saving={photoSaving} error={photoError} onChoose={choosePhoto} onZoom={setPhotoZoom} onRotate={() => setPhotoRotation((value) => (value + 90) % 360)} onSave={saveProfilePhoto} onDelete={deleteProfilePhoto} onClose={() => setPhotoOpen(false)} /> : null}
    </div>
  );
}

function PhotoModal({ preview, editable, inputRef, zoom, rotation, saving, error, onChoose, onZoom, onRotate, onSave, onDelete, onClose }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071126]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Profile photo editor">
    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#40518c] bg-[#101b32] text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><h2 className="text-lg font-bold">Profile photo</h2><button type="button" onClick={onClose} className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close"><Icon>close</Icon></button></div>
      <div className="flex flex-col items-center px-5 py-7 sm:px-8">
        <div className="relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-full border-4 border-white/80 bg-[#d3e4fe] shadow-[0_0_0_8px_rgba(141,167,245,.18)] sm:h-72 sm:w-72">
          {preview ? <img src={preview} alt="Profile preview" className="h-full w-full object-cover" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }} /> : <Icon className="text-7xl text-[#334b91]">person</Icon>}
        </div>
        {editable ? <>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChoose} />
          <div className="mt-7 grid w-full grid-cols-3 gap-2 text-center text-xs text-white/80"><button type="button" onClick={() => inputRef.current?.click()} className="rounded-xl border border-white/15 px-3 py-3 hover:bg-white/10"><Icon className="mb-1 block text-xl">upload</Icon>Update</button><button type="button" onClick={onRotate} className="rounded-xl border border-white/15 px-3 py-3 hover:bg-white/10"><Icon className="mb-1 block text-xl">rotate_right</Icon>Rotate</button><button type="button" onClick={onDelete} disabled={!preview || saving} className="rounded-xl border border-white/15 px-3 py-3 hover:bg-white/10 disabled:opacity-40"><Icon className="mb-1 block text-xl">delete</Icon>Delete</button></div>
          <label className="mt-6 w-full text-sm text-white/80">Zoom<input type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={(event) => onZoom(Number(event.target.value))} className="mt-2 w-full accent-[#8da7f5]" /></label>
          {error ? <p className="mt-4 w-full rounded-lg bg-[#ffdad6] px-3 py-2 text-sm font-semibold text-[#8b1a1a]">{error}</p> : null}
          <button type="button" onClick={onSave} disabled={!preview || saving} className="mt-6 w-full rounded-lg bg-[#8da7f5] px-4 py-3 text-sm font-bold text-[#0b1c30] hover:bg-[#aec0ff] disabled:opacity-50">{saving ? "Saving photo…" : "Save photo"}</button>
        </> : <p className="mt-6 text-sm text-white/70">Profile photo</p>}
      </div>
    </div>
  </div>;
}

function ProfileActions({ isOwnProfile, isClient, viewerId, connection, follow, onConnect, onFollow, onIgnore }) {
  const [showMore, setShowMore] = useState(false);

  if (isOwnProfile) {
    return (
      <div className="flex w-full gap-2 sm:w-auto">
        <NavLink to="/app/onboarding" className="flex-1 sm:flex-initial">
          <SecondaryButton>
            <Icon className="text-[18px]">edit</Icon>Edit profile
          </SecondaryButton>
        </NavLink>
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D8DADF] text-[#565e74] transition hover:bg-[#E7F3FF]"
          aria-label="More profile options"
        >
          <Icon>more_horiz</Icon>
        </button>
      </div>
    );
  }

  const isIncomingPending = connection?.recipient_id === viewerId && connection?.status === "pending";
  const isOutgoingPending = connection?.requester_id === viewerId && connection?.status === "pending";
  const isAccepted = connection?.status === "accepted";

  return (
    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
      {/* ---- Connection button states ---- */}
      {isIncomingPending ? (
        // Incoming request: show Accept + Ignore side by side
        <>
          <PrimaryButton onClick={onConnect}>
            <Icon className="text-[18px]">person_add</Icon>Accept
          </PrimaryButton>
          <SecondaryButton onClick={onIgnore}>
            <Icon className="text-[18px]">close</Icon>Ignore
          </SecondaryButton>
        </>
      ) : isOutgoingPending ? (
        // Outgoing pending: show "Pending" button (click = withdraw)
        <SecondaryButton onClick={onConnect} className="!border-[#1877F2] !text-[#1877F2]">
          <Icon className="text-[18px]">schedule</Icon>Pending
        </SecondaryButton>
      ) : isAccepted ? (
        // Already connected
        <div className="relative">
          <SecondaryButton onClick={() => setShowMore((v) => !v)}>
            <Icon className="text-[18px]">how_to_reg</Icon>Connected
            <Icon className="text-[16px]">expand_more</Icon>
          </SecondaryButton>
          {showMore && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-[#E4E6EB] bg-white shadow-lg">
              <button
                type="button"
                onClick={() => { setShowMore(false); onConnect(); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#050505] hover:bg-[#F0F2F5]"
              >
                <Icon className="text-[18px] text-[#65676B]">person_remove</Icon>Remove connection
              </button>
            </div>
          )}
        </div>
      ) : (
        // No connection yet
        <PrimaryButton onClick={onConnect}>
          <Icon className="text-[18px]">person_add</Icon>Connect
        </PrimaryButton>
      )}

      {/* ---- Follow ---- */}
      <SecondaryButton onClick={onFollow}>
        <Icon className="text-[18px]">{follow ? "check" : "rss_feed"}</Icon>
        {follow ? "Following" : "Follow"}
      </SecondaryButton>

      {/* ---- Message ---- */}
      <SecondaryButton>
        <Icon className="text-[18px]">chat_bubble_outline</Icon>Message
      </SecondaryButton>

      {/* ---- Hire / View projects ---- */}
      <PrimaryButton>
        <Icon className="text-[18px]">{isClient ? "work" : "work_outline"}</Icon>
        {isClient ? "View projects" : "Hire"}
      </PrimaryButton>
    </div>
  );
}


function SectionTitle({ icon, title }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-[#0b1c30] sm:text-base">
      <Icon className="text-[18px] text-[#3d3fc4] sm:text-[19px]">{icon}</Icon>
      {title}
    </h2>
  );
}

function Tag({ children }) {
  return <span className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-xs font-semibold text-[#26395b]">{children}</span>;
}

function Metric({ icon, value, label, accent = "text-[#3d3fc4]" }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-white/70 px-1.5 py-2 sm:px-2">
      <Icon className={`text-[20px] sm:text-[21px] ${accent}`}>{icon}</Icon>
      <div className="mt-1 text-base font-bold text-[#0b1c30] sm:text-lg">{value}</div>
      <div className="whitespace-nowrap text-[10px] leading-tight tracking-tight text-[#565e74]">{label}</div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#767586] sm:text-[11px]">{label}</dt>
      <dd className="mt-1 text-[13px] font-semibold leading-5 text-[#0b1c30] sm:text-sm">{value || "—"}</dd>
    </div>
  );
}
