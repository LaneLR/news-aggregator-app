"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

// layout.js already sets the initial data-theme attribute server-side (from
// the seeded session) so there's no flash on first paint. This just keeps
// it in sync after a client-side theme change (see ThemeSelector's
// update()) or a login/logout, without needing a full page reload.
export default function ThemeProvider({ children }) {
  const { data: session } = useSession();
  const selectedTheme = session?.user?.selectedTheme || null;

  useEffect(() => {
    // No session at all → always light, matching layout.js's SSR rule:
    // dark is something a signed-in user opts into, never a logged-out
    // visitor's OS preference.
    if (!session) {
      document.documentElement.setAttribute("data-theme", "default");
    } else if (selectedTheme) {
      document.documentElement.setAttribute("data-theme", selectedTheme);
    } else {
      // Signed in with no explicit choice ("Auto") → no attribute at all,
      // so the prefers-color-scheme media query in themes.scss takes over.
      document.documentElement.removeAttribute("data-theme");
    }
  }, [session, selectedTheme]);

  return children;
}
