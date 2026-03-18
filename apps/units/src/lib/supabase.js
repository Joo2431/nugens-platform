import { createClient } from "@supabase/supabase-js";

// Hardcoded — do NOT use env vars as they may be set incorrectly in Cloudflare
const SUPA_URL = "https://qllvyqdzpxgubiuujhbm.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsbHZ5cWR6cHhndWJpdXVqaGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTY4MjgsImV4cCI6MjA4NzkzMjgyOH0.OOP-s4eOl-oYdCrGFONIROv3_mx05d212ZyEfPmCHRg";

const cookieStorage = {
  getItem(key) {
    if (typeof document === "undefined") return null;
    const match = document.cookie.split("; ").find(r => r.startsWith(key + "="));
    if (!match) return null;
    try { return decodeURIComponent(match.split("=").slice(1).join("=")); } catch { return null; }
  },
  setItem(key, value) {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=${encodeURIComponent(value)}; domain=.nugens.in.net; path=/; max-age=31536000; SameSite=Lax; Secure`;
  },
  removeItem(key) {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=; domain=.nugens.in.net; path=/; max-age=0`;
  },
};

export const supabase = createClient(SUPA_URL, SUPA_KEY, {
  auth: {
    storage: cookieStorage,
    storageKey: "ng-auth",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,  // SSO: must be true so OAuth code in URL is auto-exchanged
  },
});
