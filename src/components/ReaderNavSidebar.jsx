"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutGrid, Sparkles, Layers, Search, Bookmark, Lock } from "lucide-react";
import { CATEGORY_LINKS } from "./HeaderNavBar";
import styles from "./ReaderNavSidebar.module.scss";

const TOP_LINKS = [
  { label: "All Articles", href: "/news", Icon: LayoutGrid },
  { label: "For You", href: "/for-you", Icon: Sparkles, subscriberOnly: true },
  { label: "My Feeds", href: "/feeds", Icon: Layers, subscriberOnly: true },
  { label: "Search", href: "/search", Icon: Search },
  { label: "Archives", href: "/archives", Icon: Bookmark },
];

// Left pane of the 3-pane reader view (see ThreePaneLayout.jsx) — a
// persistent jump-list so switching sections doesn't require scrolling
// back up to the header, the Spotify-sidebar pattern the "3-pane" idea
// was modeled on. Reuses HeaderNavBar's own CATEGORY_LINKS so the two
// stay in sync automatically.
export default function ReaderNavSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  const visibleTop = TOP_LINKS.filter((l) => isSubscribed || !l.subscriberOnly);
  // Every category is shown now — Market/Journal get a lock badge instead
  // of being hidden, matching HeaderNavBar's own CATEGORY_LINKS treatment.

  return (
    <nav className={styles.sidebar}>
      <ul className={styles.linkList}>
        {visibleTop.map(({ label, href, Icon }) => (
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
      <div className={styles.sectionLabel}>Categories</div>
      <ul className={styles.linkList}>
        {CATEGORY_LINKS.map(({ label, href, Icon, gated }) => (
          <li key={href}>
            <Link
              href={href}
              className={`${styles.link} ${pathname === href ? styles.active : ""}`}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
              {gated && !isSubscribed && (
                <Lock size={11} strokeWidth={2.5} className={styles.lockIcon} aria-label="Subscribers only" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
