"use client";
import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Every role="dialog" aria-modal="true" in this app needs the same three
// things — move focus in on open, keep Tab/Shift+Tab cycling within the
// dialog instead of escaping to whatever's behind the overlay, and restore
// focus to whatever had it once the dialog closes — but there was no shared
// way to get them, so none of the six dialogs actually had any of the
// three. containerRef's element should have tabIndex={-1} so it's a valid
// focus target even on a dialog with no focusable children yet (e.g. one
// that opens into a loading state).
export function useFocusTrap(containerRef, isActive) {
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;
    previouslyFocusedRef.current = document.activeElement;

    const container = containerRef.current;
    if (container) {
      const firstFocusable = container.querySelector(FOCUSABLE_SELECTOR);
      (firstFocusable || container).focus();
    }

    const handleKeyDown = (e) => {
      if (e.key !== "Tab" || !containerRef.current) return;
      const focusable = Array.from(containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isActive, containerRef]);
}
