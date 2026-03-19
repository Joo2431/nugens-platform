/**
 * apiClient.js — Authenticated API client for HyperX
 * Auto-attaches Supabase session token to every request (fixes 401 errors).
 * Place at: apps/hyperx/src/lib/apiClient.js
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