"use client";
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import styles from "./FeatureCallout.module.scss";

const STORAGE_KEY = "morningfeeds:dismissedFeatureCallout";

// A one-time, dismissible tour of features that are easy to miss (the
// 3-pane reader chief among them — see OnboardingFlow's step 3 for new
// signups; this is the same tour for accounts that predate that step, or
// who clicked "Skip for now"). Per-device via localStorage, not per-account
// — matches useLocalOrder's convention elsewhere in this app.
export default function FeatureCallout() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private browsing / storage disabled — it'll just show again next visit.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.callout}>
      <Sparkles size={18} strokeWidth={2} className={styles.icon} />
      <div className={styles.body}>
        <p className={styles.title}>A couple of things worth knowing</p>
        <ul className={styles.list}>
          <li>Click any article to open it in the reading pane right next to your list — no page reload.</li>
          <li>
            Press <kbd>?</kbd> anywhere to see keyboard shortcuts — <kbd>j</kbd>/<kbd>k</kbd> to move,{" "}
            <kbd>o</kbd> to open, <kbd>s</kbd> to save.
          </li>
          <li>Drag the category tabs and header icons to reorder them however you like.</li>
        </ul>
      </div>
      <button type="button" className={styles.closeButton} onClick={dismiss} aria-label="Dismiss this tip">
        <X size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
