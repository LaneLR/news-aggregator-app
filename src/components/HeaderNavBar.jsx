"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Layers } from "lucide-react";
import styles from "./HeaderNavBar.module.scss";

const PERSONAL_LINKS = [
  { label: "For You", href: "/for-you", Icon: Sparkles },
  { label: "My Feeds", href: "/feeds", Icon: Layers },
];

const CATEGORY_LINKS = [
  { label: "Journals", href: "/category/journal", subscriberOnly: true },
  { label: "Market", href: "/category/market", subscriberOnly: true },
  { label: "Science", href: "/category/science" },
  { label: "Business", href: "/category/business" },
  { label: "Health", href: "/category/health" },
  { label: "Entertainment", href: "/category/entertainment" },
  { label: "Tech", href: "/category/tech" },
  { label: "Politics", href: "/category/politics" },
  { label: "Sports", href: "/category/sports" },
  { label: "World", href: "/category/world" },
  { label: "US", href: "/category/us" },
  { label: "Finance", href: "/category/finance", subscriberOnly: true },
  { label: "Weather", href: "/category/weather" },
];

export default function HeaderNavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  return (
    <div className={styles.wrapper}>
      {isSubscribed &&
        PERSONAL_LINKS.map(({ label, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.link} ${pathname === href ? styles.active : ""}`}
          >
            <Icon size={15} strokeWidth={2.25} />
            {label}
          </Link>
        ))}
      {isSubscribed && <span className={styles.divider} />}
      {CATEGORY_LINKS.filter((link) => isSubscribed || !link.subscriberOnly).map(
        ({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.link} ${pathname === href ? styles.active : ""}`}
          >
            {label}
          </Link>
        )
      )}
    </div>
  );
}
