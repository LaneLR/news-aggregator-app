"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { applyCustomOrder } from "@/lib/useLayoutPrefs";
import { useLocalOrder } from "@/lib/useLocalOrder";
import { useDragReorder } from "@/lib/useDragReorder";
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
// the bar doesn't turn into an ever-scrolling wall of 15 pills. Exported so
// the onboarding flow can reuse the same category/icon list.
export const CATEGORY_LINKS = [
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
  const [menuPosition, setMenuPosition] = useState(null);
  const moreRef = useRef(null);
  const menuRef = useRef(null);

  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  // The nav bar scrolls horizontally (overflow-x: auto), which per the CSS
  // spec forces overflow-y to compute as auto too — so a dropdown positioned
  // absolute inside it gets clipped by the bar's own scroll box instead of
  // floating over the page. Portaling it to <body> and positioning it from
  // the button's actual screen coordinates sidesteps that entirely.
  const toggleMoreMenu = () => {
    if (!isMoreOpen && moreRef.current) {
      const rect = moreRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setIsMoreOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedButton = moreRef.current?.contains(event.target);
      const clickedMenu = menuRef.current?.contains(event.target);
      if (!clickedButton && !clickedMenu) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMoreOpen) return;
    // The button's position is only known at the moment the menu opens — if
    // the bar scrolls or the window resizes after that, just close it rather
    // than tracking and re-measuring on every scroll event.
    const close = () => setIsMoreOpen(false);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [isMoreOpen]);

  const [categoryOrder, setCategoryOrder] = useLocalOrder("morningfeeds:categoryOrder");
  const canReorder = !!session?.user?.id;

  const visibleCategories = CATEGORY_LINKS.filter(
    (link) => isSubscribed || !link.subscriberOnly
  );
  const primaryCategoriesDefault = visibleCategories.filter((link) => link.primary);
  const moreCategories = visibleCategories.filter((link) => !link.primary);

  const primaryCategories = canReorder
    ? applyCustomOrder(primaryCategoriesDefault, categoryOrder, (l) => l.href)
    : primaryCategoriesDefault;

  const { draggedIndex, dragOverIndex, getHandlers } = useDragReorder(
    primaryCategories,
    (reordered) => setCategoryOrder(reordered.map((l) => l.href))
  );

  const NavLink = ({ label, href, Icon, dragProps, dragState }) => (
    <Link
      href={href}
      className={`${styles.link} ${pathname === href ? styles.active : ""} ${
        dragProps ? styles.draggable : ""
      } ${dragState === "dragging" ? styles.dragging : ""} ${
        dragState === "dragOver" ? styles.dragOver : ""
      }`}
      {...dragProps}
    >
      <Icon size={15} strokeWidth={2.25} />
      {label}
    </Link>
  );

  return (
    <nav className={styles.wrapper} aria-label="Categories">
      <NavLink {...ALL_ARTICLES_LINK} />
      <span className={styles.divider} />
      {isSubscribed && PERSONAL_LINKS.map((link) => <NavLink key={link.href} {...link} />)}
      {primaryCategories.map((link, i) => (
        <NavLink
          key={link.href}
          {...link}
          dragProps={canReorder ? getHandlers(i) : undefined}
          dragState={draggedIndex === i ? "dragging" : dragOverIndex === i ? "dragOver" : undefined}
        />
      ))}
      {moreCategories.length > 0 && (
        <div className={styles.moreWrapper} ref={moreRef}>
          <button
            type="button"
            className={`${styles.link} ${moreCategories.some((l) => l.href === pathname) ? styles.active : ""}`}
            onClick={toggleMoreMenu}
          >
            More
            <ChevronDown size={15} strokeWidth={2.25} />
          </button>
          {isMoreOpen &&
            menuPosition &&
            createPortal(
              <ul
                ref={menuRef}
                className={styles.moreMenu}
                style={{ top: menuPosition.top, right: menuPosition.right }}
              >
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
              </ul>,
              document.body
            )}
        </div>
      )}
    </nav>
  );
}
