"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts, isTypingTarget } from "@/components/KeyboardShortcutsProvider";

// Adds j/k/o/s/l-style navigation over a flat list of articles rendered as
// NewsCardThree cards. Returns `selectedIndex` and `cardRefs` — callers pass
// `cardRefs.current[i]` as the ref for the i-th card (see CategoryPage.jsx)
// so this hook can apply a focus outline and scroll the selected card into
// view, and so the save/like actions can click the card's own buttons
// (see NewsCardThree's data-action attributes) instead of re-implementing
// their stateful save/like logic from outside the component.
export function useArticleShortcuts(articles, onOpen) {
  const { shortcuts } = useKeyboardShortcuts();
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const cardRefs = useRef([]);

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, articles.length);
  }, [articles.length]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // None of this app's single-key shortcuts are meant to combine with a
      // modifier — without this guard, e.g. Ctrl/Cmd+K (open command
      // palette) would also fire the bare "k" (previous article) binding
      // since modifier keys don't change event.key for letter keys.
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const typing = isTypingTarget(event.target);

      // "/" focuses search even while not inside the article list — and
      // must preventDefault or Firefox's quick-find hijacks it.
      if (!typing && event.key === shortcuts.search) {
        const searchInput = document.querySelector("[data-search-input]");
        if (searchInput) {
          event.preventDefault();
          searchInput.focus();
        }
        return;
      }

      if (typing || articles.length === 0) return;

      if (event.key === shortcuts.next) {
        event.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, articles.length - 1));
      } else if (event.key === shortcuts.prev) {
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === shortcuts.open || event.key === "Enter") {
        const article = articles[selectedIndex];
        if (!article) return;
        // In the 3-pane reader view, "open" selects the article into the
        // reading pane in place instead of leaving the list (see
        // ThreePaneLayout.jsx). Falls back to a full navigation everywhere
        // else, matching the pre-3-pane behavior.
        if (onOpen) onOpen(article);
        else router.push(`/article/${article.id}`);
      } else if (event.key === shortcuts.save) {
        cardRefs.current[selectedIndex]
          ?.querySelector('[data-action="save"]')
          ?.click();
      } else if (event.key === shortcuts.like) {
        cardRefs.current[selectedIndex]
          ?.querySelector('[data-action="like"]')
          ?.click();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [articles, selectedIndex, shortcuts, router, onOpen]);

  useEffect(() => {
    if (selectedIndex >= 0) {
      cardRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  return { selectedIndex, cardRefs };
}
