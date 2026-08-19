"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Newspaper, Sparkles, Heart, Bookmark, User } from "lucide-react";
import styles from "./MobileTabBar.module.scss";

// Bottom tab bar for mobile — hidden above 768px via CSS (see the module's
// media query) so desktop keeps using the header/sidebar nav as-is. Only
// rendered for signed-in sessions, matching Header's own session gate; the
// logged-out marketing pages don't need an app-style tab bar.
//
// No Search tab: the header's own search bar is always one upward scroll
// away (see Header.jsx's hide-on-scroll-down/reveal-on-scroll-up behavior),
// so a dedicated tab just duplicated an entry point that's already never
// more than a swipe away — see /search/page.jsx's own empty-state prompt
// for anyone who still lands there directly (a shared link, bookmark, etc).
const TABS = [
  { label: "Home", href: "/news", Icon: Newspaper },
  { label: "For You", href: "/for-you", Icon: Sparkles, subscriberOnly: true },
  { label: "Liked", href: "/liked", Icon: Heart, freeOnly: true },
  { label: "Saved", href: "/archives", Icon: Bookmark },
  { label: "Account", href: "/account", Icon: User },
];

export default function MobileTabBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  const tabs = TABS.filter((tab) => {
    if (tab.subscriberOnly) return isSubscribed;
    if (tab.freeOnly) return !isSubscribed;
    return true;
  });

  return (
    <nav className={styles.wrapper} aria-label="Primary">
      {tabs.map(({ label, href, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.tab} ${active ? styles.active : ""}`}
          >
            <Icon size={21} strokeWidth={active ? 2.4 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
