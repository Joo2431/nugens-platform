/**
 * useProfile.js — Fixed
 * Queries by ID first, falls back to email if ID doesn't match.
 * This resolves the OAuth ID mismatch where profile row has a different
 * UUID than the current auth session.
 */
import { useState, useEffect } from "react";
import { supabase } from "./supabase";

async function fetchByIdOrEmail(userId, email) {
  // 1. Try by auth user ID
  const { data: byId } = await supabase
    .from("profiles").select("*").eq("id", userId).maybeSingle();
  if (byId) return byId;

  // 2. Fallback: find by email (handles OAuth ID mismatch)
  if (!email) return null;
  const { data: byEmail } = await supabase
    .from("profiles").select("*").eq("email", email).maybeSingle();
  if (!byEmail) return null;

  // Silently fix the ID so future queries work by ID
  await supabase.from("profiles").update({ id: userId }).eq("email", email).catch(() => {});
  return { ...byEmail, id: userId };
}

export function useProfile() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) { settled = true; setReady(true); }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_e, session) => {
        if (session?.user) {
          const prof = await fetchByIdOrEmail(session.user.id, session.user.email);
          setUser(session.user);
          setProfile(prof);
          if (!settled) finish(session.user, prof);
        } else {
          setUser(null); setProfile(null);
          if (!settled) finish(null, null);
        }
      }
    );

    // getSession as parallel backup
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && !settled) {
        const prof = await fetchByIdOrEmail(session.user.id, session.user.email);
        finish(session.user, prof);
      } else if (!session?.user && !settled) {
        finish(null, null);
      }
    });

    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  return { user, profile, ready, signOut };
}