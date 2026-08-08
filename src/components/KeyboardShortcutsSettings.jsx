"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  DEFAULT_KEYBOARD_SHORTCUTS,
  SHORTCUT_ACTIONS,
  SHORTCUT_LABELS,
} from "@/lib/keyboardShortcuts";
import styles from "./KeyboardShortcutsSettings.module.scss";

export default function KeyboardShortcutsSettings({ initialShortcuts }) {
  const [shortcuts, setShortcuts] = useState(
    initialShortcuts || DEFAULT_KEYBOARD_SHORTCUTS
  );
  const [listeningFor, setListeningFor] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const persist = async (next) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users/keyboard-shortcuts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyboardShortcuts: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setShortcuts(data.keyboardShortcuts);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCapture = (action) => (event) => {
    event.preventDefault();
    const key = event.key;

    if (key === "Escape") {
      setListeningFor(null);
      return;
    }
    if (key === "Tab" || key === "Shift" || key === "Control" || key === "Alt" || key === "Meta") {
      return;
    }

    const conflictingAction = SHORTCUT_ACTIONS.find(
      (other) => other !== action && shortcuts[other] === key
    );
    if (conflictingAction) {
      setError(
        `"${key}" is already used for "${SHORTCUT_LABELS[conflictingAction]}".`
      );
      return;
    }

    const next = { ...shortcuts, [action]: key };
    setShortcuts(next);
    setListeningFor(null);
    persist(next);
  };

  const handleReset = () => {
    setShortcuts(DEFAULT_KEYBOARD_SHORTCUTS);
    setError("");
    persist(DEFAULT_KEYBOARD_SHORTCUTS);
  };

  return (
    <div>
      <p className={styles.helperText}>
        Navigate and act on articles without a mouse. Click a key below, then
        press the key you want to use instead.
      </p>

      <ul className={styles.list}>
        {SHORTCUT_ACTIONS.map((action) => (
          <li key={action}>
            <span>{SHORTCUT_LABELS[action]}</span>
            <button
              type="button"
              className={`${styles.keyButton} ${listeningFor === action ? styles.listening : ""}`}
              onClick={() => {
                setError("");
                setListeningFor(action);
              }}
              onKeyDown={listeningFor === action ? handleCapture(action) : undefined}
              onBlur={() => setListeningFor((prev) => (prev === action ? null : prev))}
              disabled={saving}
            >
              {listeningFor === action ? "Press a key…" : shortcuts[action]}
            </button>
          </li>
        ))}
      </ul>

      {error && <p className={styles.errorText}>{error}</p>}

      <button type="button" className={styles.resetButton} onClick={handleReset} disabled={saving}>
        <RotateCcw size={14} strokeWidth={2} />
        Reset to defaults
      </button>
    </div>
  );
}
