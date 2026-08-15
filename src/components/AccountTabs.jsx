"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AccountTabs.module.scss";

const TABS = [
  { key: "profile", label: "Profile", href: "/account" },
  { key: "settings", label: "Settings", href: "/settings" },
];

// Shared by /account and /settings (see ProfilePage.jsx / app/settings/page.jsx)
// so the two pages read as one tabbed "account" area — same mechanics as
// LegalInfoPage's tab row (separate routes, real <Link> navigation, active
// state driven by the current path) rather than a client-state tab switch,
// matching this codebase's only existing multi-page-tab precedent.
export default function AccountTabs() {
  const pathname = usePathname();

  return (
    <div className={styles.tabRow}>
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`${styles.tab} ${pathname === tab.href ? styles.activeTab : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
