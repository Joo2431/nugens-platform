/**
 * apiClient.js — Shared authenticated API client for all Nugens apps
 *
 * WHY THIS EXISTS:
 * The backend uses requireAuth middleware that checks Authorization: Bearer <token>.
 * Previously, every page called fetch() directly without the token → 401 errors everywhere.
 * This utility auto-attaches the Supabase session token to every request.
 *
 * USAGE:
 *   import { apiPost, apiGet } from "../lib/apiClient";
 *   const data = await apiPost("/api/mini-chat", { message: "...", userType: "individual" });
 */

import { supabase } from "./supabase";

const BASE = "https://nugens-platform.onrender.com";

async function getToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

function buildHeaders(token, extra = {}) {
  const h = { "Content-Type": "application/json", ...extra };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

/**
 * POST to the Nugens backend with automatic auth token injection.
 * Returns parsed JSON or throws an error.
 */
export async function apiPost(endpoint, body = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err?.error || err?.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * GET from the Nugens backend with automatic auth token injection.
 */
export async function apiGet(endpoint, params = {}) {
  const token = await getToken();
  const qs = Object.keys(params).length
    ? "?" + new URLSearchParams(params).toString()
    : "";
  const res = await fetch(`${BASE}${endpoint}${qs}`, {
    method: "GET",
    headers: buildHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err?.error || err?.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * SSE streaming POST (for Gen-E chat and tool streaming).
 * Returns an EventSource-compatible response object.
 */
export async function apiStream(endpoint, body = {}) {
  const token = await getToken();
  return fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });
}

/**
 * Convenience: call /api/mini-chat with automatic auth.
 * Used by all apps for Gen-E Mini popup and in-page AI calls.
 */
export async function miniChat(message, product = "nugens", userType = "individual", extra = {}) {
  return apiPost("/api/mini-chat", {
    message,
    product,
    userType,
    ...extra,
  });
}

/**
 * Free image generation via Pollinations.ai — no API key required.
 * Falls back to DALL-E 3 via backend if Pollinations fails.
 */
export async function generateImage(prompt, { width = 1024, height = 1024, model = "flux" } = {}) {
  const encoded = encodeURIComponent(
    `${prompt}. High quality, professional, clean design.`
  );
  // Pollinations.ai — completely free, no auth, no rate limit for basic use
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=${model}&nologo=true&enhance=true`;

  // Test if Pollinations is reachable
  try {
    const res = await fetch(pollinationsUrl, { method: "HEAD" });
    if (res.ok) return pollinationsUrl;
  } catch {}

  // Fallback: DALL-E 3 via backend (requires paid OpenAI key on server)
  const data = await apiPost("/api/digihub/generate-image", { prompt, size: `${width}x${height}` });
  return data?.url || data?.image_url;
}
