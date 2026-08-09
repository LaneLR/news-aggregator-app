"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

// layout.js already sets the initial data-theme attribute server-side (from
// the seeded session) so there's no flash on first paint. This just keeps
// it in sync after a client-side theme change (see ThemeSelector's
// update()) without needing a full page reload.
export default function ThemeProvider({ children }) {
  const { data: session } = useSession();
  const selectedTheme = session?.user?.selectedTheme || null;

  useEffect(() => {
    // No explicit choice → no attribute at all, so the prefers-color-scheme
    // media query in themes.scss can take over (matches layout.js's SSR
    // behavior for the same case).
    if (selectedTheme) {
      document.documentElement.setAttribute("data-theme", selectedTheme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [selectedTheme]);

  return children;
}
