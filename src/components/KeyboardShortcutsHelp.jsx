"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { SHORTCUT_ACTIONS, SHORTCUT_LABELS } from "@/lib/keyboardShortcuts";
import styles from "./KeyboardShortcutsHelp.module.scss";

export default function KeyboardShortcutsHelp({ shortcuts, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-help-title"
      >
        <div className={styles.header}>
          <h2 id="shortcuts-help-title">Keyboard Shortcuts</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <ul className={styles.list}>
          {SHORTCUT_ACTIONS.map((action) => (
            <li key={action}>
              <span>{SHORTCUT_LABELS[action]}</span>
              <kbd>{shortcuts[action]}</kbd>
            </li>
          ))}
          <li>
            <span>{SHORTCUT_LABELS.open} (alternate)</span>
            <kbd>Enter</kbd>
          </li>
        </ul>
        <p className={styles.footerNote}>
          Customize these anytime in Settings → Keyboard Shortcuts.
        </p>
      </div>
    </div>
  );
}
