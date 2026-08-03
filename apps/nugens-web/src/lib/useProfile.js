import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export function useProfile() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    let settled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => { setProfile(data ?? null); if (!settled) { settled = true; setReady(true); } });
      } else {
        setProfile(null);
        if (!settled) { settled = true; setReady(true); }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => { setProfile(data ?? null); if (!settled) { settled = true; setReady(true); } });
      } else {
        if (!settled) { settled = true; setReady(true); }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://nugens.in.net/auth";
  };

  return { user, profile, ready, signOut };
}
