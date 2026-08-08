"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DEFAULT_KEYBOARD_SHORTCUTS } from "@/lib/keyboardShortcuts";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";

const KeyboardShortcutsContext = createContext({
  shortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
  setShortcuts: () => {},
});

export function useKeyboardShortcuts() {
  return useContext(KeyboardShortcutsContext);
}

export function isTypingTarget(target) {
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

// Mounted once in the root layout. Shortcuts work immediately with the
// hardcoded defaults (no flash of "not working yet"), then quietly upgrade
// to the signed-in user's saved bindings once the fetch resolves — same
// "fetch preference data directly, don't bloat the session" convention used
// for mutedKeywords/preferredCategories elsewhere in this app.
export default function KeyboardShortcutsProvider({ children }) {
  const { data: session } = useSession();
  const [shortcuts, setShortcuts] = useState(DEFAULT_KEYBOARD_SHORTCUTS);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;

    fetch("/api/users/keyboard-shortcuts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.keyboardShortcuts) {
          setShortcuts(data.keyboardShortcuts);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isTypingTarget(event.target)) return;
      if (event.key === shortcuts.help) {
        event.preventDefault();
        setHelpOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts.help]);

  return (
    <KeyboardShortcutsContext.Provider value={{ shortcuts, setShortcuts }}>
      {children}
      {helpOpen && (
        <KeyboardShortcutsHelp shortcuts={shortcuts} onClose={() => setHelpOpen(false)} />
      )}
    </KeyboardShortcutsContext.Provider>
  );
}
