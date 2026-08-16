import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * useMetaPixel — fires a Meta (Facebook) Pixel PageView event every time
 * the in-app route changes.
 *
 * The base Meta Pixel snippet in index.html only fires PageView once, on
 * the very first load. Since this app is a React Router SPA, navigating
 * between routes does not reload the page, so without this hook Meta
 * would only ever see one PageView per visitor per session.
 */
export function useMetaPixel() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    window.fbq("track", "PageView");
  }, [location.pathname, location.search]);
}
