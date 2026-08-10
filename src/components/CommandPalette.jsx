"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Bookmark, Heart, Settings, User, LayoutGrid, CornerDownLeft } from "lucide-react";
import { CATEGORY_LINKS, PERSONAL_LINKS } from "./HeaderNavBar";
import styles from "./CommandPalette.module.scss";

const EXTRA_LINKS = [
  { label: "All Articles", href: "/news", Icon: LayoutGrid },
  { label: "Your Archives", href: "/archives", Icon: Bookmark },
  { label: "Liked Articles", href: "/liked", Icon: Heart },
  { label: "Settings", href: "/settings", Icon: Settings },
  { label: "Account", href: "/account", Icon: User },
];

// Desktop power-user affordance — Ctrl/Cmd+K opens a fuzzy-filterable list
// of every category/page in the app, plus a fallback to full article
// search for anything that doesn't match a known destination. Keyboard-only
// entry point by design (no visible trigger button) — the shortcuts
// cheatsheet (KeyboardShortcutsProvider's "?" overlay) is the discovery
// path, matching how this class of tool (Linear, Notion, Superhuman) works.
export default function CommandPalette() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  const allDestinations = useMemo(() => {
    const links = [...EXTRA_LINKS, ...PERSONAL_LINKS, ...CATEGORY_LINKS];
    return links.filter((link) => isSubscribed || !link.subscriberOnly);
  }, [isSubscribed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allDestinations;
    return allDestinations.filter((d) => d.label.toLowerCase().includes(q));
  }, [query, allDestinations]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveIndex(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const goTo = (href) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) {
        goTo(filtered[activeIndex].href);
      } else if (query.trim()) {
        goTo(`/search?query=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  if (!isOpen) return null;

  const trimmedQuery = query.trim();

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div
        className={styles.palette}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className={styles.inputRow}>
          <Search size={17} strokeWidth={2.25} />
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Jump to a category, page, or search articles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className={styles.escHint}>Esc</kbd>
        </div>

        <div className={styles.results}>
          {filtered.length === 0 ? (
            trimmedQuery && (
              <button
                type="button"
                className={`${styles.resultItem} ${styles.active}`}
                onClick={() => goTo(`/search?query=${encodeURIComponent(trimmedQuery)}`)}
              >
                <Search size={16} strokeWidth={2} />
                <span>Search articles for &ldquo;{trimmedQuery}&rdquo;</span>
                <CornerDownLeft size={14} strokeWidth={2} className={styles.enterHint} />
              </button>
            )
          ) : (
            filtered.map((dest, i) => (
              <button
                key={dest.href}
                type="button"
                className={`${styles.resultItem} ${i === activeIndex ? styles.active : ""}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => goTo(dest.href)}
              >
                <dest.Icon size={16} strokeWidth={2} />
                <span>{dest.label}</span>
                {i === activeIndex && (
                  <CornerDownLeft size={14} strokeWidth={2} className={styles.enterHint} />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
