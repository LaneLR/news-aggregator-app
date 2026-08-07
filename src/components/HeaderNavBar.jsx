"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Sparkles,
  Layers,
  BookOpen,
  LineChart,
  Briefcase,
  Cpu,
  FlaskConical,
  Trophy,
  HeartPulse,
  Clapperboard,
  Landmark,
  Globe,
  Flag,
  DollarSign,
  CloudSun,
  ChevronDown,
} from "lucide-react";
import styles from "./HeaderNavBar.module.scss";

const ALL_ARTICLES_LINK = { label: "All Articles", href: "/news", Icon: LayoutGrid };

const PERSONAL_LINKS = [
  { label: "For You", href: "/for-you", Icon: Sparkles, subscriberOnly: true },
  { label: "My Feeds", href: "/feeds", Icon: Layers, subscriberOnly: true },
];

// `primary` links stay visible in the bar; the rest live behind "More" so
// the bar doesn't turn into an ever-scrolling wall of 15 pills.
const CATEGORY_LINKS = [
  { label: "Journals", href: "/category/journal", Icon: BookOpen, subscriberOnly: true, primary: true },
  { label: "Market", href: "/category/market", Icon: LineChart, subscriberOnly: true, primary: true },
  { label: "Business", href: "/category/business", Icon: Briefcase, primary: true },
  { label: "Tech", href: "/category/tech", Icon: Cpu, primary: true },
  { label: "Science", href: "/category/science", Icon: FlaskConical, primary: true },
  { label: "Sports", href: "/category/sports", Icon: Trophy, primary: true },
  { label: "Health", href: "/category/health", Icon: HeartPulse },
  { label: "Entertainment", href: "/category/entertainment", Icon: Clapperboard },
  { label: "Politics", href: "/category/politics", Icon: Landmark },
  { label: "World", href: "/category/world", Icon: Globe },
  { label: "US", href: "/category/us", Icon: Flag },
  { label: "Finance", href: "/category/finance", Icon: DollarSign, subscriberOnly: true },
  { label: "Weather", href: "/category/weather", Icon: CloudSun },
];

export default function HeaderNavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleCategories = CATEGORY_LINKS.filter(
    (link) => isSubscribed || !link.subscriberOnly
  );
  const primaryCategories = visibleCategories.filter((link) => link.primary);
  const moreCategories = visibleCategories.filter((link) => !link.primary);

  const NavLink = ({ label, href, Icon }) => (
    <Link
      href={href}
      className={`${styles.link} ${pathname === href ? styles.active : ""}`}
    >
      <Icon size={15} strokeWidth={2.25} />
      {label}
    </Link>
  );

  return (
    <div className={styles.wrapper}>
      <NavLink {...ALL_ARTICLES_LINK} />
      <span className={styles.divider} />
      {isSubscribed && PERSONAL_LINKS.map((link) => <NavLink key={link.href} {...link} />)}
      {primaryCategories.map((link) => (
        <NavLink key={link.href} {...link} />
      ))}
      {moreCategories.length > 0 && (
        <div className={styles.moreWrapper} ref={moreRef}>
          <button
            type="button"
            className={`${styles.link} ${moreCategories.some((l) => l.href === pathname) ? styles.active : ""}`}
            onClick={() => setIsMoreOpen((prev) => !prev)}
          >
            More
            <ChevronDown size={15} strokeWidth={2.25} />
          </button>
          {isMoreOpen && (
            <ul className={styles.moreMenu}>
              {moreCategories.map(({ label, href, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`${styles.moreMenuItem} ${pathname === href ? styles.active : ""}`}
                    onClick={() => setIsMoreOpen(false)}
                  >
                    <Icon size={16} strokeWidth={2} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
