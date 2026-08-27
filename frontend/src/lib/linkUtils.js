// Detects the "kind" of an external link the user pastes in (YouTube, Instagram,
// GitHub, LinkedIn, website, etc.) so the UI can show the right icon/label without
// the user having to pick a type manually, and without us hosting any video/image
// uploads for these platforms — we just store + display the link.

const PATTERNS = [
  { key: "youtube", label: "YouTube", icon: "smart_display", test: /youtu\.?be/i },
  { key: "instagram", label: "Instagram", icon: "photo_camera", test: /instagram\.com/i },
  { key: "linkedin", label: "LinkedIn", icon: "work", test: /linkedin\.com/i },
  { key: "github", label: "GitHub", icon: "code", test: /github\.com/i },
  { key: "behance", label: "Behance", icon: "palette", test: /behance\.net/i },
  { key: "dribbble", label: "Dribbble", icon: "sports_basketball", test: /dribbble\.com/i },
  { key: "figma", label: "Figma", icon: "design_services", test: /figma\.com/i },
  { key: "x", label: "X / Twitter", icon: "tag", test: /(twitter\.com|x\.com)/i },
  { key: "facebook", label: "Facebook", icon: "thumb_up", test: /facebook\.com/i },
  { key: "tiktok", label: "TikTok", icon: "music_note", test: /tiktok\.com/i },
  { key: "medium", label: "Medium", icon: "article", test: /medium\.com/i },
  { key: "upwork", label: "Upwork", icon: "business_center", test: /upwork\.com/i },
  { key: "vimeo", label: "Vimeo", icon: "movie", test: /vimeo\.com/i },
  { key: "whatsapp", label: "WhatsApp", icon: "chat", test: /(wa\.me|whatsapp\.com)/i },
];

export function detectLinkMeta(rawUrl = "") {
  const url = String(rawUrl || "").trim();
  if (!url) return { key: "website", label: "Website", icon: "language" };

  const match = PATTERNS.find((pattern) => pattern.test.test(url));
  if (match) return { key: match.key, label: match.label, icon: match.icon };

  try {
    const { hostname } = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    const niceHost = hostname.replace(/^www\./, "");
    return { key: "website", label: niceHost || "Website", icon: "language" };
  } catch {
    return { key: "website", label: "Website", icon: "language" };
  }
}

export function normalizeUrl(rawUrl = "") {
  const url = String(rawUrl || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (/^(mailto:|tel:)/i.test(url)) return url;
  return `https://${url}`;
}

export function isLikelyUrl(rawUrl = "") {
  const url = String(rawUrl || "").trim();
  if (!url) return false;
  try {
    // eslint-disable-next-line no-new
    new URL(normalizeUrl(url));
    return true;
  } catch {
    return false;
  }
}
