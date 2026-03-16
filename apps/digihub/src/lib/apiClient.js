/**
 * apiClient.js — Authenticated API client for DigiHub
 * Reads VITE_GEN_E_API_URL from .env so it works in both dev and production.
 * Auto-attaches Supabase session token to every request (fixes 401 errors).
 */
import { supabase } from "./supabase";

const BASE = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

async function getToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

function buildHeaders(token) {
  const h = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

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

export async function apiStream(endpoint, body = {}) {
  const token = await getToken();
  return fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });
}

/**
 * miniChat — call /api/mini-chat for all in-app AI features.
 * Used by PromptSpace, AIAssistant, and GenEMiniPopup.
 */
export async function miniChat(message, product = "digihub", userType = "individual", extra = {}) {
  return apiPost("/api/mini-chat", {
    message,
    product,
    userType,
    ...extra,
  });
}

/**
 * generateImage — free image generation via Pollinations AI.
 * No API key required. Falls back to backend DALL-E if needed.
 */
export async function generateImage(prompt, { width = 1024, height = 1024, model = "flux" } = {}) {
  const encoded = encodeURIComponent(
    `${prompt}. High quality, professional, clean design.`
  );
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=${model}&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 99999)}`;

  // Try Pollinations first (free)
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    if (res.ok) return url;
  } catch {}

  // Fallback: DALL-E via backend
  const data = await apiPost("/api/digihub/generate-image", { prompt, size: `${width}x${height}` });
  return data?.url || data?.image_url;
}
