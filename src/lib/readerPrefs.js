"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "morningfeeds:readerPrefs";

// Local-only (not synced to the account) — reading display preferences are a
// "how does my current browser render text" setting, not identity data, and
// keeping it local means it works for anonymous readers too (articles are
// public pages, not gated behind login).
export const DEFAULT_READER_PREFS = {
  fontSize: "medium",
  fontFamily: "default",
  lineHeight: "normal",
  contentWidth: "normal",
};

export const FONT_SIZE_STEPS = {
  small: "0.92rem",
  medium: "1.05rem",
  large: "1.2rem",
  xlarge: "1.4rem",
};

export const LINE_HEIGHT_STEPS = {
  compact: "1.5",
  normal: "1.75",
  relaxed: "2.1",
};

export const CONTENT_WIDTH_STEPS = {
  narrow: "560px",
  normal: "720px",
  wide: "880px",
};

// Reuses the two fonts the site already loads (next/font vars set in
// layout.js) rather than pulling in a new typeface just for this.
export const FONT_FAMILY_STEPS = {
  default: "var(--font-roboto), Arial, Helvetica, sans-serif",
  serif: "var(--font-lora), Georgia, 'Times New Roman', serif",
};

export function readerPrefsToCssVars(prefs) {
  return {
    "--reader-font-size": FONT_SIZE_STEPS[prefs.fontSize] || FONT_SIZE_STEPS.medium,
    "--reader-line-height": LINE_HEIGHT_STEPS[prefs.lineHeight] || LINE_HEIGHT_STEPS.normal,
    "--reader-content-width": CONTENT_WIDTH_STEPS[prefs.contentWidth] || CONTENT_WIDTH_STEPS.normal,
    "--reader-font-family": FONT_FAMILY_STEPS[prefs.fontFamily] || FONT_FAMILY_STEPS.default,
  };
}

export function useReaderPrefs() {
  const [prefs, setPrefs] = useState(DEFAULT_READER_PREFS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPrefs({ ...DEFAULT_READER_PREFS, ...JSON.parse(saved) });
    } catch {
      // Ignore malformed/unavailable storage — falls back to defaults.
    }
  }, []);

  const updatePrefs = (partial) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Best-effort persistence only.
      }
      return next;
    });
  };

  const resetPrefs = () => updatePrefs(DEFAULT_READER_PREFS);

  return { prefs, updatePrefs, resetPrefs };
}
