"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

// layout.js already sets the initial data-theme attribute server-side (from
// the seeded session) so there's no flash on first paint. This just keeps
// it in sync after a client-side theme change (see ThemeSelector's
// update()) without needing a full page reload.
export default function ThemeProvider({ children }) {
  const { data: session } = useSession();
  const selectedTheme = session?.user?.selectedTheme || "default";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }, [selectedTheme]);

  return children;
}
