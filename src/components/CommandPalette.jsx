"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Bookmark, Heart, Settings, User, LayoutGrid, CornerDownLeft } from "lucide-react";
import { CATEGORY_LINKS, PERSONAL_LINKS } from "@/lib/navLinks";
import { useFocusTrap } from "@/lib/useFocusTrap";
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
//
// Follows the ARIA combobox-with-listbox pattern: the input is the only
// focusable element (arrow keys move a virtual selection, not real DOM
// focus — options aren't independently tabbable), announced to screen
// readers via aria-activedescendant rather than actual focus movement.
export default function CommandPalette() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const paletteRef = useRef(null);
  useFocusTrap(paletteRef, isOpen);

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

  const closePalette = () => setIsOpen(false);

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

  // Focus itself is handled by useFocusTrap (moves into the input on open,
  // restores on close) — this just resets the search state for next time.
  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveIndex(0);
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
      closePalette();
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
  const showSearchFallback = filtered.length === 0 && trimmedQuery;
  const activeOptionId = showSearchFallback
    ? "cmdp-option-fallback"
    : filtered[activeIndex]
    ? `cmdp-option-${activeIndex}`
    : undefined;

  return (
    <div className={styles.overlay} onClick={closePalette}>
      <div
        ref={paletteRef}
        className={styles.palette}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        tabIndex={-1}
      >
        <div className={styles.inputRow}>
          <Search size={17} strokeWidth={2.25} />
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdp-listbox"
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder="Jump to a category, page, or search articles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className={styles.escHint}>Esc</kbd>
        </div>

        <div className={styles.results} role="listbox" id="cmdp-listbox" aria-label="Results">
          {showSearchFallback ? (
            <div
              id="cmdp-option-fallback"
              role="option"
              aria-selected="true"
              className={`${styles.resultItem} ${styles.active}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => goTo(`/search?query=${encodeURIComponent(trimmedQuery)}`)}
            >
              <Search size={16} strokeWidth={2} />
              <span>Search articles for &ldquo;{trimmedQuery}&rdquo;</span>
              <CornerDownLeft size={14} strokeWidth={2} className={styles.enterHint} />
            </div>
          ) : (
            filtered.map((dest, i) => (
              <div
                key={dest.href}
                id={`cmdp-option-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`${styles.resultItem} ${i === activeIndex ? styles.active : ""}`}
                onMouseEnter={() => setActiveIndex(i)}
                // Prevents the input from losing focus on click — the
                // dialog only ever has one real focus target (see combobox
                // note above), mousedown would otherwise blur it first.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goTo(dest.href)}
              >
                <dest.Icon size={16} strokeWidth={2} />
                <span>{dest.label}</span>
                {i === activeIndex && (
                  <CornerDownLeft size={14} strokeWidth={2} className={styles.enterHint} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
