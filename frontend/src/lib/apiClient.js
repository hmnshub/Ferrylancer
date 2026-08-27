import { supabase } from "./supabaseClient";

// Base URL of the Node.js backend (see /server). Configure via
// VITE_API_BASE_URL in your .env — defaults to the local dev server.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function authHeaders() {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

// Uploads (avatar / cover / post / portfolio images) go through multipart/form-data
// so the backend can resize+compress with sharp before storing in Supabase Storage.
export async function apiUpload(file, kind) {
  const headers = await authHeaders();
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  const res = await fetch(`${API_BASE_URL}/api/uploads`, { method: "POST", headers, body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}
