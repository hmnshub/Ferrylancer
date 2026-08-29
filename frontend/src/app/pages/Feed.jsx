import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { apiDelete, apiUpload } from "../../lib/apiClient";
import { compressMultipleImages } from "../../lib/imageCompressor";
import { detectLinkMeta, normalizeUrl } from "../../lib/linkUtils";
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { PhotoGrid } from "../ui/PhotoGrid";
import { Avatar, Card, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

export default function Feed({ profile, session }) {
  const [connectionStates, setConnectionStates] = useState({});
  const { data: posts = [], refetch: refetchPosts } = useSupabaseQuery(
    (sb) =>
      sb
        .from("posts")
        .select("*, author:profiles!posts_author_id_fkey(full_name, title, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(20),
    [],
    []
  );
  const { data: projects = [] } = useSupabaseQuery(
    (sb) => sb.from("projects").select("*").eq("status", "Open").order("created_at", { ascending: false }).limit(3),
    [],
    []
  );
  const { data: people = [] } = useSupabaseQuery(
    (sb) =>
      sb
        .from("profiles")
        .select("id, full_name, title, avatar_url")
        .neq("id", session?.user?.id || "00000000-0000-0000-0000-000000000000")
        .limit(3),
    [session?.user?.id],
    []
  );
  const { data: existingConnections = [] } = useSupabaseQuery(
    (sb) =>
      session?.user?.id
        ? sb
            .from("connections")
            .select("requester_id, recipient_id, status")
            .or(`requester_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
        : Promise.resolve({ data: [], error: null }),
    [session?.user?.id],
    []
  );
  const trendingSkills = [...new Set(projects.flatMap((project) => project.tags || []))].slice(0, 6);

  const connect = async (personId) => {
    if (!supabase || !session?.user?.id || connectionStatus(personId)) return;
    setConnectionStates((previous) => ({ ...previous, [personId]: "sending" }));
    const { error } = await supabase.from("connections").insert({ requester_id: session.user.id, recipient_id: personId, status: "pending" });
    if (!error) {
      // Notify the recipient so they can accept/decline from the Notifications page
      const senderName = profile?.full_name || "Someone";
      await supabase.from("notifications").insert({
        user_id: personId,
        type: "connection",
        text: `${senderName} sent you a connection request.`,
        meta: { requester_id: session.user.id },
        unread: true,
      });
    }
    setConnectionStates((previous) => ({ ...previous, [personId]: error ? "error" : "pending" }));
  };

  const connectionStatus = (personId) => {
    const local = connectionStates[personId];
    if (local === "pending" || local === "sending") return local;
    const record = existingConnections.find((item) => item.requester_id === personId || item.recipient_id === personId);
    return record?.status || null;
  };

  const completion = profile ? estimateCompletion(profile) : 60;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT: mini profile + shortcuts */}
      <aside className="hidden flex-col gap-4 lg:flex lg:col-span-3">
        <Card className="overflow-hidden">
          <div className="relative h-20 w-full overflow-hidden bg-gradient-to-r from-[#1877F2] to-[#0B2E96]">
            {profile?.cover_url ? (
              <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1877F2]/25 to-[#0B2E96]/35" />
          </div>
          <div className="flex flex-col items-center px-6 pb-6 text-center">
            <Avatar src={profile?.avatar_url} size={64} className="relative z-10 -mt-8 border-4 border-white shadow-sm" />
            <h2 className="mt-3 text-base font-bold text-[#050505]">{profile?.full_name || "Your Name"}</h2>
            <p className="mb-3 text-sm text-[#65676B]">{profile?.title || (profile?.role === "client" ? profile?.company_name : "Add your title")}</p>
            <div className="mb-1 flex items-center gap-1 text-xs text-[#65676B]">
              <Icon className="text-[16px]">location_on</Icon>
              {profile?.location || "Add location"}
            </div>
            <div className="mt-3 w-full">
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="text-[#65676B]">Profile Strength</span>
                <span className="text-[#1877F2]">{completion}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E4E6EB]">
                <div className="h-full rounded-full bg-[#1877F2]" style={{ width: `${completion}%` }} />
              </div>
            </div>
            <NavLink to="/app/profile" className="mt-4 w-full rounded-lg border border-[#D8DADF] py-2 text-sm font-semibold text-[#050505] hover:bg-[#F0F2F5]">
              View Profile
            </NavLink>
          </div>
        </Card>

        <Card className="p-4">
          <ul className="flex flex-col gap-1">
            <li>
              <NavLink to="/app/discover" className="group flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-[#050505] hover:bg-[#F0F2F5]">
                <Icon className="text-[#65676B] group-hover:text-[#1877F2]">bookmark</Icon>
                Saved Projects
              </NavLink>
            </li>
            <li>
              <NavLink to="/app/proposals" className="group flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-[#050505] hover:bg-[#F0F2F5]">
                <Icon className="text-[#65676B] group-hover:text-[#1877F2]">send</Icon>
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
              className="flex flex-1 items-center rounded-full border border-[#D8DADF] bg-[#F0F2F5] px-4 text-left text-sm text-[#65676B] hover:bg-[#E4E6EB]"
            >
              Start a post...
            </NavLink>
          </div>
          <div className="flex flex-wrap items-center gap-1 border-t border-[#E4E6EB] pt-3">
            <NavLink to="/app/create" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#1877F2]">
              <Icon className="text-[#1877F2]">edit_document</Icon>
              Share an update
            </NavLink>
            <NavLink to="/app/create" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#1877F2]">
              <Icon className="text-[#45BD62]">imagesmode</Icon>
              Showcase your work
            </NavLink>
            {profile?.role === "client" ? (
              <NavLink to="/app/create" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#1877F2]">
                <Icon className="text-[#F7B125]">work</Icon>
                Post a project
              </NavLink>
            ) : null}
          </div>
        </Card>

        {posts.map((post) => (
          <PostCard key={post.id} post={post} profile={profile} session={session} onPostUpdated={refetchPosts} />
        ))}

        {projects.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} viewerId={session?.user?.id} />
        ))}
      </section>

      {/* RIGHT: recommendations */}
      <aside className="hidden flex-col gap-4 lg:flex lg:col-span-3">
        <Card className="p-5">
          <h3 className="mb-3 text-base font-bold text-[#050505]">Recommended Projects</h3>
          <div className="flex flex-col gap-3">
            {projects.map((item, i) => (
              <NavLink
                key={item.id}
                to={`/app/projects/${item.id}`}
                className={`block ${i < projects.length - 1 ? "border-b border-[#E4E6EB] pb-3" : ""}`}
              >
                <h4 className="mb-1 text-sm font-semibold leading-tight text-[#050505] hover:text-[#1877F2]">{item.title}</h4>
                <p className="mb-2 line-clamp-2 text-xs text-[#65676B]">{item.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded bg-[#E7F3FF] px-2 py-0.5 font-medium text-[#1877F2]">{item.status}</span>
                  <span className="font-bold text-[#050505]">{item.budget}</span>
                </div>
              </NavLink>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-base font-bold text-[#050505]">People to Connect With</h3>
          <div className="flex flex-col gap-3">
            {people.map((person) => (
              <div key={person.id} className="flex items-center gap-3">
                {(() => {
                  const status = connectionStatus(person.id);
                  const isAccepted = status === "accepted";
                  const isPending = status === "pending" || status === "sending";
                  return (
                    <>
                      <NavLink
                        to={`/app/profile/${person.id}`}
                        className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                        aria-label={`View ${person.full_name || "member"}'s profile`}
                      >
                        <Avatar src={person.avatar_url} size={40} />
                      </NavLink>
                      <NavLink to={`/app/profile/${person.id}`} className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-[#050505] hover:text-[#1877F2]">
                          {person.full_name || "Ferrylance member"}
                        </h4>
                        <p className="truncate text-xs text-[#65676B]">{person.title}</p>
                      </NavLink>
                      <button
                        onClick={() => connect(person.id)}
                        disabled={isPending || isAccepted}
                        aria-label={`Connection with ${person.full_name || "member"}`}
                        className={`flex h-8 min-w-8 shrink-0 items-center justify-center gap-1 rounded-full border px-2 text-[#65676B] hover:border-[#1877F2] hover:text-[#1877F2] disabled:cursor-default ${
                          isAccepted
                            ? "border-[#0f7a44] bg-[#e3f6ec] text-[#0f7a44]"
                            : isPending
                            ? "border-[#1877F2] bg-[#E7F3FF] text-[#1877F2]"
                            : "border-[#D8DADF]"
                        }`}
                      >
                        <Icon className="text-[18px]">{isAccepted ? "check" : isPending ? "schedule" : "person_add"}</Icon>
                        {isAccepted ? (
                          <span className="text-[10px] font-semibold">Connected</span>
                        ) : isPending ? (
                          <span className="text-[10px] font-semibold">Pending</span>
                        ) : null}
                      </button>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-base font-bold text-[#050505]">Trending Skills</h3>
          <div className="flex flex-wrap gap-2">
            {trendingSkills.map((skill) => (
              <span key={skill} className="rounded-full border border-[#D8DADF] bg-white px-3 py-1.5 text-xs font-semibold text-[#050505]">
                {skill}
              </span>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}

export function PostCard({ post, profile, session, onPostUpdated }) {
  const isOwner = Boolean(session?.user?.id && post.author_id === session.user.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [editLink, setEditLink] = useState(post.external_link || "");
  const [editPhotos, setEditPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const menuRef = useRef(null);
  const shareRef = useRef(null);
  const fileInputRef = useRef(null);

  // Like State
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes ?? 0);

  // Comment State
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.comments ?? 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const postImages = Array.isArray(post.images) && post.images.length > 0
    ? post.images
    : post.image
    ? [post.image]
    : [];

  useEffect(() => {
    if (!session?.user?.id || !post?.id) return;
    let mounted = true;
    supabase
      .from("post_likes")
      .select("post_id")
      .eq("post_id", post.id)
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data, error: likeErr }) => {
        if (!likeErr && data && mounted) {
          setIsLiked(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, [post.id, session?.user?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShareOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const author = post.author || post.profiles || {};
  const name = author.full_name || post.author_name || "Ferrylance Member";
  const title = author.title || post.author_title || "";

  const handleToggleLike = async () => {
    if (!session?.user?.id) {
      setToast("Please log in to like posts.");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    const nextLiked = !isLiked;
    const nextCount = Math.max(0, likesCount + (nextLiked ? 1 : -1));
    setIsLiked(nextLiked);
    setLikesCount(nextCount);

    try {
      if (nextLiked) {
        await supabase.from("post_likes").insert({ post_id: post.id, user_id: session.user.id });
      } else {
        await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", session.user.id);
      }
      await supabase.from("posts").update({ likes: nextCount }).eq("id", post.id);
    } catch (err) {
      console.error("Like toggle failed:", err);
      setIsLiked(!nextLiked);
      setLikesCount(likesCount);
    }
  };

  const handleToggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);
    if (nextShow && commentsList.length === 0) {
      setLoadingComments(true);
      try {
        const { data, error: commentsErr } = await supabase
          .from("post_comments")
          .select("*, author:profiles!post_comments_author_id_fkey(full_name, title, avatar_url)")
          .eq("post_id", post.id)
          .order("created_at", { ascending: true });

        if (!commentsErr && data) {
          setCommentsList(data);
        }
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !session?.user?.id) return;
    setSubmittingComment(true);
    try {
      const payload = {
        post_id: post.id,
        author_id: session.user.id,
        content: newCommentText.trim(),
      };
      const { data, error: insertErr } = await supabase
        .from("post_comments")
        .insert(payload)
        .select("*, author:profiles!post_comments_author_id_fkey(full_name, title, avatar_url)")
        .single();

      if (insertErr) throw insertErr;

      const newCommentItem = data || {
        ...payload,
        id: Math.random().toString(),
        created_at: new Date().toISOString(),
        author: {
          full_name: profile?.full_name || "You",
          avatar_url: profile?.avatar_url,
          title: profile?.title || "",
        },
      };

      setCommentsList((prev) => [...prev, newCommentItem]);
      const nextCommentsCount = commentsCount + 1;
      setCommentsCount(nextCommentsCount);
      setNewCommentText("");

      await supabase.from("posts").update({ comments: nextCommentsCount }).eq("id", post.id);
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert(err?.message || "Failed to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const { error: delErr } = await supabase.from("post_comments").delete().eq("id", commentId);
      if (delErr) throw delErr;
      setCommentsList((prev) => prev.filter((c) => c.id !== commentId));
      const nextCount = Math.max(0, commentsCount - 1);
      setCommentsCount(nextCount);
      await supabase.from("posts").update({ comments: nextCount }).eq("id", post.id);
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const postUrl = `${window.location.origin}/app#post-${post.id}`;
  const shareText = `Check out this update by ${name} on Ferrylance: "${post.content ? post.content.slice(0, 100) + '...' : ''}"`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setToast("Link copied to clipboard!");
    setMenuOpen(false);
    setShareOpen(false);
    setTimeout(() => setToast(""), 3000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Post by ${name} on Ferrylance`, text: shareText, url: postUrl });
        setShareOpen(false);
      } catch (err) {
        if (err.name !== "AbortError") handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleStartEdit = () => {
    setEditContent(post.content || "");
    setEditLink(post.external_link || "");
    setEditPhotos(postImages.map((url) => ({ url, file: null, isNew: false })));
    setError("");
    setIsEditing(true);
    setMenuOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError("");
    setEditContent(post.content || "");
    setEditLink(post.external_link || "");
    setEditPhotos([]);
  };

  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newItems = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isNew: true,
    }));
    setEditPhotos((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const handleRemovePhoto = (index) => {
    setEditPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    setError("");
    try {
      const preservedUrls = editPhotos.filter((p) => !p.isNew && p.url).map((p) => p.url);
      const newFiles = editPhotos.filter((p) => p.isNew && p.file).map((p) => p.file);

      let newlyUploadedUrls = [];
      if (newFiles.length > 0) {
        const compressed = await compressMultipleImages(newFiles);
        newlyUploadedUrls = await Promise.all(
          compressed.map(async (file, idx) => {
            try {
              const res = await apiUpload(file, "post-image");
              return res?.url;
            } catch (apiErr) {
              console.warn("Backend upload failed, attempting direct Supabase storage upload...", apiErr);
              const fileExt = file.name?.split(".").pop() || "webp";
              const fileName = `${session.user.id}/${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
              const { error: storageError } = await supabase.storage
                .from("post-images")
                .upload(fileName, file, { contentType: file.type || "image/webp", upsert: true });

              if (storageError) throw new Error(storageError.message || apiErr.message);
              const { data: publicUrlData } = supabase.storage.from("post-images").getPublicUrl(fileName);
              return publicUrlData?.publicUrl;
            }
          })
        );
      }

      const finalUrls = [...preservedUrls, ...newlyUploadedUrls.filter(Boolean)];

      const updatePayload = {
        content: editContent.trim(),
        image: finalUrls[0] || null,
        images: finalUrls,
        external_link: editLink.trim() || null,
      };

      let { error: updateErr } = await supabase
        .from("posts")
        .update(updatePayload)
        .eq("id", post.id);

      if (updateErr && /images.*schema cache|column.*images/i.test(`${updateErr?.message || ""} ${updateErr?.details || ""}`)) {
        const { images: _ignored, ...fallbackPayload } = updatePayload;
        const retry = await supabase.from("posts").update(fallbackPayload).eq("id", post.id);
        if (retry.error) throw retry.error;
      } else if (updateErr) {
        throw updateErr;
      }

      setIsEditing(false);
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      console.error("Update post failed:", err);
      setError(err?.message || "Failed to update post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiDelete(`/api/posts/${post.id}`);

      setShowDeleteConfirm(false);
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      console.error("Delete post failed:", err);
      alert(err?.message || "Failed to delete post.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="relative p-6">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-2 flex items-center gap-3 text-[#ba1a1a]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1f1]">
                <Icon className="text-2xl">delete</Icon>
              </div>
              <h3 className="text-base font-bold text-[#050505]">Delete Post</h3>
            </div>
            <p className="text-sm text-[#65676B]">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <SecondaryButton onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                Cancel
              </SecondaryButton>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ba1a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#93000a] disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Notification Toast */}
      {toast ? (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-lg bg-[#050505] px-3 py-1.5 text-xs font-semibold text-white shadow-md animate-fade-in">
          <Icon className="text-[16px] text-[#0f7a44]">check_circle</Icon>
          {toast}
        </div>
      ) : null}

      {/* Post Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex gap-3">
          <Avatar src={author.avatar_url} size={48} />
          <div>
            <h3 className="text-base font-bold leading-tight text-[#050505]">{name}</h3>
            {title ? <p className="text-sm text-[#65676B]">{title}</p> : null}
            <p className="mt-0.5 text-xs text-[#8A8D91]">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#050505]"
            aria-label="Post options"
          >
            <Icon>more_horiz</Icon>
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-[#D8DADF] bg-white py-1.5 shadow-lg">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-[#050505] hover:bg-[#F0F2F5]"
                  >
                    <Icon className="text-[18px] text-[#65676B]">edit</Icon>
                    Edit post
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-[#ba1a1a] hover:bg-[#fff1f1]"
                  >
                    <Icon className="text-[18px] text-[#ba1a1a]">delete</Icon>
                    Delete post
                  </button>
                  <div className="my-1 border-t border-[#E4E6EB]" />
                </>
              ) : null}
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-[#050505] hover:bg-[#F0F2F5]"
              >
                <Icon className="text-[18px] text-[#65676B]">link</Icon>
                Copy link
              </button>
              {!isOwner ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setToast("Post reported. Thank you!");
                    setTimeout(() => setToast(""), 3000);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-[#65676B] hover:bg-[#F0F2F5]"
                >
                  <Icon className="text-[18px]">flag</Icon>
                  Report post
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Post Body: Edit Mode or Normal Mode */}
      {isEditing ? (
        <div className="flex flex-col gap-3">
          <textarea
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full resize-none rounded-lg border border-[#D8DADF] p-3 text-sm text-[#050505] outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
            placeholder="Edit your post..."
          />

          {/* Edit Photos Grid Preview */}
          {editPhotos.length > 0 && (
            <div className="rounded-xl border border-[#D8DADF] bg-[#F0F2F5] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[#050505]">{editPhotos.length} photo(s)</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs font-semibold text-[#1877F2] hover:underline"
                >
                  <Icon className="text-[16px]">add_photo_alternate</Icon>
                  Add more
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {editPhotos.map((photo, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-[#D8DADF] bg-black/5">
                    <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition hover:bg-black/90"
                      title="Remove photo"
                    >
                      <Icon className="text-[14px]">close</Icon>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editPhotos.length === 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-fit items-center gap-1.5 rounded-lg border border-[#D8DADF] px-3 py-1.5 text-xs font-semibold text-[#65676B] hover:border-[#1877F2] hover:text-[#1877F2]"
            >
              <Icon className="text-[18px]">add_photo_alternate</Icon>
              Add photos
            </button>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />

          <input
            value={editLink}
            onChange={(e) => setEditLink(e.target.value)}
            placeholder="Optional link (e.g. https://...)"
            className="w-full rounded-lg border border-[#D8DADF] px-3 py-2 text-xs text-[#050505] outline-none focus:border-[#1877F2]"
          />
          {error ? <p className="text-xs font-semibold text-[#ba1a1a]">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton onClick={handleCancelEdit} disabled={saving}>
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleSaveEdit} disabled={saving || !editContent.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 whitespace-pre-line text-sm leading-6 text-[#050505]">{post.content}</p>

          {/* Facebook-style Photo Gallery */}
          {postImages.length > 0 && <PhotoGrid images={postImages} />}

          {post.external_link ? (
            <a
              href={normalizeUrl(post.external_link)}
              target="_blank"
              rel="noreferrer"
              className="mb-4 flex items-center gap-2 rounded-lg border border-[#D8DADF] bg-[#F0F2F5] p-3 text-xs font-semibold text-[#1877F2] hover:bg-[#E7F3FF]"
            >
              <Icon className="text-[18px]">{detectLinkMeta(post.external_link).icon}</Icon>
              <span className="truncate">{post.external_link}</span>
              <Icon className="ml-auto text-[16px] text-[#65676B]">open_in_new</Icon>
            </a>
          ) : null}

          {/* Post Action Bar (Like, Comment, Share) */}
          <div className="relative flex items-center gap-2 border-t border-[#E4E6EB] pt-2 sm:gap-3">
            {/* LIKE BUTTON */}
            <button
              type="button"
              onClick={handleToggleLike}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                isLiked
                  ? "bg-[#E7F3FF] text-[#1877F2]"
                  : "text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#050505]"
              }`}
            >
              <Icon filled={isLiked} className={`text-[20px] ${isLiked ? "text-[#1877F2]" : ""}`}>thumb_up</Icon>
              <span>{likesCount > 0 ? `${likesCount} Like${likesCount > 1 ? "s" : ""}` : "Like"}</span>
            </button>

            {/* COMMENT BUTTON */}
            <button
              type="button"
              onClick={handleToggleComments}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                showComments
                  ? "bg-[#F0F2F5] text-[#050505]"
                  : "text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#050505]"
              }`}
            >
              <Icon className="text-[20px]">chat_bubble</Icon>
              <span>{commentsCount > 0 ? `${commentsCount} Comment${commentsCount > 1 ? "s" : ""}` : "Comment"}</span>
            </button>

            {/* SHARE BUTTON */}
            <div className="flex-1 relative" ref={shareRef}>
              <button
                type="button"
                onClick={() => setShareOpen(!shareOpen)}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                  shareOpen
                    ? "bg-[#F0F2F5] text-[#1877F2]"
                    : "text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#050505]"
                }`}
              >
                <Icon className="text-[20px]">share</Icon>
                <span>Share</span>
              </button>

              {/* Share Popover Menu */}
              {shareOpen && (
                <div className="absolute right-0 bottom-full mb-2 z-30 w-56 rounded-xl border border-[#D8DADF] bg-white p-2 shadow-xl animate-fade-in">
                  <div className="px-2 py-1.5 text-xs font-bold text-[#65676B] uppercase tracking-wider">
                    Share Post
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#050505] hover:bg-[#F0F2F5]"
                  >
                    <Icon className="text-[18px] text-[#1877F2]">link</Icon>
                    Copy link
                  </button>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + postUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#050505] hover:bg-[#F0F2F5]"
                  >
                    <Icon className="text-[18px] text-[#25D366]">chat</Icon>
                    WhatsApp
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#050505] hover:bg-[#F0F2F5]"
                  >
                    <Icon className="text-[18px] text-[#0A66C2]">work</Icon>
                    LinkedIn
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#050505] hover:bg-[#F0F2F5]"
                  >
                    <Icon className="text-[18px] text-[#1DA1F2]">tag</Icon>
                    X / Twitter
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#050505] hover:bg-[#F0F2F5]"
                  >
                    <Icon className="text-[18px] text-[#1877F2]">thumb_up</Icon>
                    Facebook
                  </a>
                  {typeof navigator !== "undefined" && navigator.share && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="flex w-full items-center gap-2.5 rounded-lg border-t border-[#E4E6EB] mt-1 pt-2 px-2.5 py-2 text-left text-xs font-semibold text-[#65676B] hover:bg-[#F0F2F5]"
                    >
                      <Icon className="text-[18px]">share</Icon>
                      More options...
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COMMENTS SECTION */}
          {showComments && (
            <div className="mt-4 border-t border-[#E4E6EB] pt-4">
              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2.5 items-start mb-4">
                <Avatar src={profile?.avatar_url} size={32} />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 rounded-full border border-[#D8DADF] bg-[#F0F2F5] px-4 py-2 text-xs text-[#050505] outline-none placeholder:text-[#8A8D91] focus:border-[#1877F2] focus:bg-white focus:ring-2 focus:ring-[#1877F2]/20"
                  />
                  <PrimaryButton
                    type="submit"
                    disabled={submittingComment || !newCommentText.trim()}
                    className="rounded-full px-4 py-1.5 text-xs h-8"
                  >
                    {submittingComment ? "..." : "Post"}
                  </PrimaryButton>
                </div>
              </form>

              {/* Comments List */}
              {loadingComments ? (
                <div className="py-3 text-center text-xs text-[#65676B]">
                  <Icon className="animate-spin inline mr-1 text-sm">progress_activity</Icon>
                  Loading comments...
                </div>
              ) : commentsList.length === 0 ? (
                <p className="py-2 text-center text-xs text-[#8A8D91]">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                  {commentsList.map((comm) => {
                    const commAuthor = comm.author || {};
                    const commName = commAuthor.full_name || "Ferrylance Member";
                    const isCommOwner = session?.user?.id && comm.author_id === session.user.id;
                    return (
                      <div key={comm.id} className="flex items-start gap-2.5 text-xs">
                        <Avatar src={commAuthor.avatar_url} size={32} />
                        <div className="group flex-1 rounded-2xl bg-[#F0F2F5] p-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-[#050505]">{commName}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#8A8D91]">{timeAgo(comm.created_at)}</span>
                              {isCommOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comm.id)}
                                  className="text-[#65676B] hover:text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition"
                                  title="Delete comment"
                                >
                                  <Icon className="text-[14px]">delete</Icon>
                                </button>
                              )}
                            </div>
                          </div>
                          {commAuthor.title && (
                            <p className="text-[10px] text-[#65676B] -mt-0.5 mb-1">{commAuthor.title}</p>
                          )}
                          <p className="whitespace-pre-line text-[#050505] mt-1">{comm.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function OpportunityCard({ opportunity, viewerId }) {
  const isOwner = opportunity.client_id === viewerId;
  return (
    <article className="relative overflow-hidden rounded-xl border border-[#D8DADF] bg-white p-6 pl-7 shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-[#1877F2]" />
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1877F2]">
        <Icon filled className="text-[16px]">campaign</Icon>
        Project Opportunity
      </div>
      <h3 className="mb-2 text-lg font-bold text-[#050505]">{opportunity.title}</h3>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5 text-[#050505]">
          <Icon className="text-[18px] text-[#65676B]">payments</Icon>
          Budget: <span className="font-bold text-[#0f7a44]">{opportunity.budget}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#050505]">
          <Icon className="text-[18px] text-[#65676B]">schedule</Icon>
          Est. Time: {opportunity.estimated_time || "Flexible"}
        </div>
      </div>
      <p className="mb-4 text-sm text-[#65676B]">{opportunity.description}</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {opportunity.tags.map((tag) => (
          <span key={tag} className="rounded-md bg-[#E7F3FF] px-2.5 py-1 text-xs font-semibold text-[#1877F2]">
            {tag}
          </span>
        ))}
      </div>
      <NavLink to={isOwner ? `/app/projects?project=${opportunity.id}` : `/app/projects/${opportunity.id}`}>
        <PrimaryButton>{isOwner ? "Manage Project" : "View Project"}</PrimaryButton>
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
  return Math.min(95, Math.round((step / total) * 100));
}
