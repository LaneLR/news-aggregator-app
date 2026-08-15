"use client";
import { usePathname } from "next/navigation";
import ReaderNavSidebar from "./ReaderNavSidebar";
import styles from "./MainContentWrapper.module.scss";

// Standalone/single-purpose pages where a category nav sidebar doesn't
// belong — marketing/landing, auth, legal/static, and the onboarding flow.
// Everything else (category pages, /news, /search, /archives, the article
// reader, account/settings, etc.) gets the persistent sidebar, for every
// visitor — logged in or not. A blocklist rather than an allowlist so a
// new content page gets the sidebar automatically without needing to
// remember to add it here.
const HIDDEN_SIDEBAR_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/pricing",
  "/privacy",
  "/terms-of-service",
  "/contact-us",
  "/about",
  "/forgot-password",
  "/password-reset",
  "/onboarding",
  "/subscribe",
]);

function shouldShowSidebar(pathname) {
  if (HIDDEN_SIDEBAR_PATHS.has(pathname)) return false;
  if (pathname.startsWith("/verification/")) return false;
  return true;
}

export default function MainContentWrapper({ children }) {
  const pathname = usePathname();
  const showSidebar = shouldShowSidebar(pathname);

  return (
    <div className={styles.shell}>
      {showSidebar && <ReaderNavSidebar />}
      <main id="main-content" className={styles.wrapper}>
        {children}
      </main>
    </div>
  );
}
