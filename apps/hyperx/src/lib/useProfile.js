/**
 * useProfile.js — Fixed
 *
 * Changes from original:
 *  - Removed the silent UPDATE profiles SET id=userId WHERE email=...
 *    The anon key cannot UPDATE rows it doesn't own (Supabase RLS blocks this).
 *    That update was silently swallowed by the .catch(()=>{}) and the returned
 *    profile had a stale id, causing every subsequent query-by-id to miss.
 *  - Added explicit error logging on both query paths so failures surface in
 *    the console immediately.
 *  - Returns the email-matched row as-is — admin checks already use email
 *    directly, so the plan column value is still correct without the ID fix.
 *
 * NOTE: App.jsx does not use this hook — it has its own inline fetchProfile.
 * This file is kept for any other components that may import it. Both
 * implementations now use the same safe strategy.
 */
import { useState, useEffect } from "react";
import { supabase } from "./supabase";

async function fetchByIdOrEmail(userId, email) {
  // 1. Try by auth user ID
  const { data: byId, error: idErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (idErr) {
    console.error("[HyperX] useProfile — fetchByIdOrEmail by ID:", idErr.message);
  }
  if (byId) return byId;

  // 2. Fallback: find by email (handles OAuth UUID mismatch)
  if (!email) return null;

  const { data: byEmail, error: emailErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (emailErr) {
    console.error("[HyperX] useProfile — fetchByIdOrEmail by email:", emailErr.message);
  }
  if (!byEmail) return null;

  // FIX: Do NOT attempt to UPDATE the id.
  // The anon key cannot UPDATE a row it doesn't own — RLS blocks this silently.
  // The .catch(()=>{}) in the original swallowed the error completely.
  // Admin access and plan checks both use email, so returning as-is is correct.
  return byEmail;
}

export function useProfile() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn("[HyperX] useProfile: forced ready after timeout");
        setReady(true);
      }
    }, 5000);

    function finish(usr, prof) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      setUser(usr ?? null);
      setProfile(prof ?? null);
      setReady(true);
    }

    // onAuthStateChange fires reliably even when getSession hangs
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        const prof = await fetchByIdOrEmail(session.user.id, session.user.email);
        setUser(session.user);
        setProfile(prof);
        if (!settled) finish(session.user, prof);
      } else {
        setUser(null);
        setProfile(null);
        if (!settled) finish(null, null);
      }
    });

    // getSession as parallel backup
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && !settled) {
        const prof = await fetchByIdOrEmail(session.user.id, session.user.email);
        finish(session.user, prof);
      } else if (!session?.user && !settled) {
        finish(null, null);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  return { user, profile, ready, signOut };
}