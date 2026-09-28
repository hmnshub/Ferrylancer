import { supabase } from "./supabaseClient";
import { runBackgroundTask } from "./backgroundTasks";

// Base URL of the Node.js backend (see /server). Configure via
// VITE_API_BASE_URL in your .env — defaults to the local dev server.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function authHeaders() {
  if (!supabase) return {};
  let { data } = await supabase.auth.getSession();
  let token = data?.session?.access_token;

  // getSession can briefly return an expired session while the auth client is
  // refreshing it (especially after a Vite HMR reload). Refresh once before
  // sending a protected request so the API does not see a stale bearer token.
  if (!token || (data?.session?.expires_at && data.session.expires_at * 1000 <= Date.now() + 5000)) {
    const refreshed = await supabase.auth.refreshSession();
    data = refreshed.data;
    token = data?.session?.access_token;
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function throwApiError(res, fallback) {
  let message = fallback;
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
  } catch {
    // Keep the status-based fallback when the response is not JSON.
  }
  const error = new Error(message);
  error.status = res.status;
  throw error;
}

export async function apiGet(path) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) await throwApiError(res, `GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwApiError(res, `POST ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiDelete(path) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE", headers });
  if (!res.ok) await throwApiError(res, `DELETE ${path} failed: ${res.status}`);
  return res.json();
}

// Uploads (avatar / cover / post / portfolio images) go through multipart/form-data
// so the backend can resize+compress with sharp before storing in Supabase Storage.
export function apiUpload(file, kind) {
  return runBackgroundTask({
    label: `Uploading ${kind.replace("-", " ")}` ,
    kind: "upload",
    run: async (update) => {
      update(20, "Preparing upload");
      const headers = await authHeaders();
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const res = await fetch(`${API_BASE_URL}/api/uploads`, { method: "POST", headers, body: form });
      if (!res.ok) await throwApiError(res, `Upload failed: ${res.status}`);
      update(95, "Finishing upload");
      return res.json();
    },
  });
}
