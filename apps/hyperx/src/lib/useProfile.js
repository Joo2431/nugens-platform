/**
 * useProfile.js — Fixed version
 * Uses onAuthStateChange FIRST (reliable), getSession as backup.
 * Tries profile by ID, falls back to email if ID mismatch.
 * Place at: apps/hyperx/src/lib/useProfile.js
 */
import { useState, useEffect } from "react";
import { supabase } from "./supabase";

async function getProfileData(userId, userEmail) {
  try {
    const { data: byId } = await supabase
      .from("profiles").select("*").eq("id", userId).maybeSingle();
    if (byId) return byId;

    if (userEmail) {
      const { data: byEmail } = await supabase
        .from("profiles").select("*").eq("email", userEmail).maybeSingle();
      if (byEmail) {
        await supabase.from("profiles").update({ id: userId }).eq("email", userEmail);
        return { ...byEmail, id: userId };
      }
    }
    return null;
  } catch { return null; }
}

export function useProfile() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    let settled = false;

    const hardTimeout = setTimeout(() => {
      if (!settled) { settled = true; setReady(true); }
    }, 5000);

    function finish(usr, prof) {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimeout);
      setUser(usr ?? null);
      setProfile(prof ?? null);
      setReady(true);
    }

    // onAuthStateChange is the primary — fires before getSession resolves
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_e, session) => {
        if (session?.user) {
          const prof = await getProfileData(session.user.id, session.user.email);
          setUser(session.user);
          setProfile(prof);
          if (!settled) finish(session.user, prof);
        } else {
          setUser(null); setProfile(null);
          if (!settled) finish(null, null);
        }
      }
    );

    // getSession as backup
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && !settled) {
        const prof = await getProfileData(session.user.id, session.user.email);
        finish(session.user, prof);
      } else if (!session && !settled) {
        finish(null, null);
      }
    });

    return () => { clearTimeout(hardTimeout); subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  return { user, profile, ready, signOut };
}