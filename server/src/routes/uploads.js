import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Keep uploads in memory — we resize with sharp before ever writing to disk/storage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB raw upload cap
});

const BUCKETS = {
  avatar: { bucket: "avatars", maxWidth: 512, quality: 82 },
  cover: { bucket: "avatars", maxWidth: 1600, quality: 78 },
  "post-image": { bucket: "post-images", maxWidth: 1600, quality: 80 },
  "portfolio-image": { bucket: "portfolio-images", maxWidth: 1600, quality: 80 },
};

/**
 * POST /api/uploads
 * multipart/form-data: { file, kind }
 * kind: "avatar" | "cover" | "post-image" | "portfolio-image"
 *
 * This is the "heavy task" the frontend defers to the backend for: resizing
 * and compressing images (via sharp) before they land in Supabase Storage,
 * so we never store multi-megabyte originals or block the browser doing it.
 */
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured on server" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const kind = req.body.kind || "post-image";
    const config = BUCKETS[kind];
    if (!config) return res.status(400).json({ error: `Unknown upload kind: ${kind}` });

    const optimized = await sharp(req.file.buffer)
      .rotate() // respect EXIF orientation
      .resize({ width: config.maxWidth, withoutEnlargement: true })
      .webp({ quality: config.quality })
      .toBuffer();

    const path = `${req.user.id}/${kind}-${randomUUID()}.webp`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(config.bucket)
      .upload(path, optimized, { contentType: "image/webp", upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseAdmin.storage.from(config.bucket).getPublicUrl(path);

    res.json({ url: publicUrlData.publicUrl, path, bucket: config.bucket });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
