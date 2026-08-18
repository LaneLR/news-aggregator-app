"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const MobileNavContext = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

// Shares the mobile category-drawer's open/closed state between Header
// (which owns the hamburger button that opens it) and ReaderNavSidebar
// (which renders the drawer itself) — they're siblings under AppWrapper,
// not parent/child, so this is the simplest way to connect them without
// prop-drilling through layout.jsx.
export function useMobileNav() {
  return useContext(MobileNavContext);
}

export default function MobileNavProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // A route change means a nav link inside the drawer was just followed —
  // close it so the next page doesn't render underneath a stale open drawer.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Background scroll fights with the drawer's own scrollable content on
  // touch devices otherwise — the page behind it keeps scrolling along with
  // (or instead of) the drawer.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  return (
    <MobileNavContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </MobileNavContext.Provider>
  );
}
