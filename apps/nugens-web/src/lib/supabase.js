import { createClient } from "@supabase/supabase-js";

// Fallback to hardcoded values if env vars not set in Cloudflare
const SUPA_URL  = import.meta.env.VITE_SUPABASE_URL  || "https://qllvyqdzpxgubiuujhbm.supabase.co";
const SUPA_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsbHZ5cWR6cHhndWJpdXVqaGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTY4MjgsImV4cCI6MjA4NzkzMjgyOH0.OOP-s4eOl-oYdCrGFONIROv3_mx05d212ZyEfPmCHRg--";

export const supabase = createClient(SUPA_URL, SUPA_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
