import { createClient } from "@supabase/supabase-js";

// Cookie-based storage so session is shared across ALL *.nugens.in.net subdomains
// Login once on nugens.in.net → automatically signed in on gene, hyperx, digihub, units
const DOMAIN = ".nugens.in.net";
const STORAGE_KEY = "nugens-session";

const cookieStorage = {
  getItem(key) {
    if (typeof document === "undefined") return null;
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${key}=`));
    if (!match) return null;
    try { return decodeURIComponent(match.split("=").slice(1).join("=")); }
    catch { return null; }
  },
  setItem(key, value) {
    if (typeof document === "undefined") return;
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `${key}=${encodeURIComponent(value)}; domain=${DOMAIN}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
  },
  removeItem(key) {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=; domain=${DOMAIN}; path=/; max-age=0`;
  },
};

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: cookieStorage,
      storageKey: STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // handles OAuth hash tokens
    },
  }
);