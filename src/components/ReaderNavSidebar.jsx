"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutGrid,
  Sparkles,
  Layers,
  Bookmark,
  Lock,
  User,
  Heart,
  Crown,
  Settings,
  LogOut,
} from "lucide-react";
import { CATEGORY_LINKS, PERSONAL_LINKS, slugFromHref } from "@/lib/navLinks";
import { useUnreadCounts } from "@/lib/useUnreadCounts";
import styles from "./ReaderNavSidebar.module.scss";

const TOP_LINKS = [
  { label: "All Articles", href: "/news", Icon: LayoutGrid },
  { label: "For You", href: "/for-you", Icon: Sparkles, subscriberOnly: true },
  { label: "My Feeds", href: "/feeds", Icon: Layers, subscriberOnly: true, countKey: "feeds" },
  ...PERSONAL_LINKS.filter((l) => l.label === "Following"),
  { label: "Liked Articles", href: "/liked", Icon: Heart },
  { label: "Archives", href: "/archives", Icon: Bookmark },
];

// Formerly split across SideNavBar (its own separate sidebar on
// account/archives/liked/following pages) and the header's burger-menu
// dropdown (Profile/Premium/Settings/Log out) — both now redundant once
// every page already has this one persistent sidebar. "Premium" is the
// only genuinely new addition from the burger menu; Profile/Settings were
// already covered by SideNavBar's own equivalents.
const ACCOUNT_LINKS = [
  { label: "Profile", href: "/account", Icon: User },
  { label: "Premium", href: "/pricing", Icon: Crown },
  { label: "Settings", href: "/settings", Icon: Settings },
];

// The persistent, always-on primary nav — not just the reader/3-pane
// density's left pane anymore (see MainContentWrapper, which now renders
// this on every content page for every visitor, logged in or not). Reuses
// HeaderNavBar's former CATEGORY_LINKS/PERSONAL_LINKS (now relocated to
// @/lib/navLinks so both this and any server component can import them)
// so category data stays in one place.
export default function ReaderNavSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  const isLoggedIn = !!session?.user?.id;
  const unreadCounts = useUnreadCounts();

  const visibleTop = TOP_LINKS.filter((l) => isSubscribed || !l.subscriberOnly);
  // Every category is shown now — Market/Journal get a lock badge instead
  // of being hidden, matching CATEGORY_LINKS' own `gated` treatment.

  return (
    <nav className={styles.sidebar} aria-label="Categories">
      <ul className={styles.linkList}>
        {visibleTop.map(({ label, href, Icon, countKey }) => {
          const count = isLoggedIn && countKey ? unreadCounts[countKey] : undefined;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.link} ${pathname === href ? styles.active : ""}`}
              >
                <Icon size={16} strokeWidth={2} />
                {label}
                {count > 0 && <span className={styles.badge}>{count > 99 ? "99+" : count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className={styles.sectionLabel}>Categories</div>
      <ul className={styles.linkList}>
        {CATEGORY_LINKS.map(({ label, href, Icon, gated }) => {
          const count = isLoggedIn ? unreadCounts.categories[slugFromHref(href)] : undefined;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.link} ${pathname === href ? styles.active : ""}`}
              >
                <Icon size={16} strokeWidth={2} />
                {label}
                {gated && !isSubscribed && (
                  <Lock size={14} strokeWidth={2.5} className={styles.lockIcon} aria-label="Subscribers only" />
                )}
                {count > 0 && <span className={styles.badge}>{count > 99 ? "99+" : count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      {isLoggedIn && (
        <>
          <div className={styles.sectionLabel}>Account</div>
          <ul className={styles.linkList}>
            {ACCOUNT_LINKS.map(({ label, href, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.link} ${pathname === href ? styles.active : ""}`}
                >
                  <Icon size={16} strokeWidth={2} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.divider} />
          <button
            type="button"
            className={styles.logoutButton}
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut size={16} strokeWidth={2} />
            Log Out
          </button>
        </>
      )}
    </nav>
  );
}
