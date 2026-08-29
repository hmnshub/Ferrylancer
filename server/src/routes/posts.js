import { Router } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

function storagePathFromUrl(value, bucket) {
  if (!value || typeof value !== "string") return null;

  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = value.indexOf(marker);
    if (markerIndex >= 0) return decodeURIComponent(value.slice(markerIndex + marker.length).split("?")[0]);
  } catch {
    return null;
  }

  return value;
}

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured on server" });

    const { data: post, error: fetchError } = await supabaseAdmin
      .from("posts")
      .select("id, author_id, image, images")
      .eq("id", req.params.id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.author_id !== req.user.id) return res.status(403).json({ error: "You can only delete your own posts" });

    const imageValues = [post.image, ...(Array.isArray(post.images) ? post.images : [])];
    const ownerPrefix = `${req.user.id}/`;
    const paths = [...new Set(imageValues
      .map((value) => storagePathFromUrl(value, "post-images"))
      .filter((path) => path && path.startsWith(ownerPrefix)))];

    // Delete the database row first. Foreign keys remove comments and likes.
    const { error: deleteError } = await supabaseAdmin.from("posts").delete().eq("id", post.id);
    if (deleteError) throw deleteError;

    // Storage cleanup is best-effort after the row is safely gone.
    let storageError = null;
    if (paths.length) {
      const result = await supabaseAdmin.storage.from("post-images").remove(paths);
      storageError = result.error || null;
      if (storageError) console.error("Post image cleanup failed:", storageError);
    }

    res.json({ deleted: true, removedImages: paths.length, storageCleanupFailed: Boolean(storageError) });
  } catch (err) {
    console.error("Delete post failed:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;
