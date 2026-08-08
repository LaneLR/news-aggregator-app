"use client";
import { useEffect, useRef, useState } from "react";
import { CaseSensitive, RotateCcw } from "lucide-react";
import styles from "./ReaderCustomizationPanel.module.scss";

const FONT_SIZE_OPTIONS = [
  { value: "small", label: "S" },
  { value: "medium", label: "M" },
  { value: "large", label: "L" },
  { value: "xlarge", label: "XL" },
];

const FONT_FAMILY_OPTIONS = [
  { value: "default", label: "Sans" },
  { value: "serif", label: "Serif" },
];

const LINE_HEIGHT_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Relaxed" },
];

const CONTENT_WIDTH_OPTIONS = [
  { value: "narrow", label: "Narrow" },
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Wide" },
];

function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.segmentGroup}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`${styles.segment} ${value === opt.value ? styles.active : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Font size / family / line height / content width — framed as an
// accessibility feature (low-vision readers), so it stays free-tier
// regardless of what else gets gated in this pass.
export default function ReaderCustomizationPanel({ prefs, onChange, onReset }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.triggerButton}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Reading display settings"
        aria-label="Reading display settings"
      >
        <CaseSensitive size={19} strokeWidth={2} />
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <SegmentedControl
            label="Text size"
            options={FONT_SIZE_OPTIONS}
            value={prefs.fontSize}
            onChange={(fontSize) => onChange({ fontSize })}
          />
          <SegmentedControl
            label="Font"
            options={FONT_FAMILY_OPTIONS}
            value={prefs.fontFamily}
            onChange={(fontFamily) => onChange({ fontFamily })}
          />
          <SegmentedControl
            label="Line spacing"
            options={LINE_HEIGHT_OPTIONS}
            value={prefs.lineHeight}
            onChange={(lineHeight) => onChange({ lineHeight })}
          />
          <SegmentedControl
            label="Content width"
            options={CONTENT_WIDTH_OPTIONS}
            value={prefs.contentWidth}
            onChange={(contentWidth) => onChange({ contentWidth })}
          />
          <button type="button" className={styles.resetButton} onClick={onReset}>
            <RotateCcw size={13} strokeWidth={2} />
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}
