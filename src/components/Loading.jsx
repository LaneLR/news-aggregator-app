"use client";
import styles from "./Loading.module.scss";

/**
 * LoadingDots
 * Props:
 *  - size: diameter of each dot in px (default 10)
 *  - color: dot color (default #0b76ff)
 *  - duration: seconds per animation cycle (default 0.9)
 *  - gap: space between dots in px (default 8)
 *  - stagger: delay step in seconds between dots (default 0.12)
 */
export default function LoadingDots({
  size = 10,
  color = "var(--theme-primary)",
  duration = 0.9,
  gap = 8,
  stagger = 0.12,
  "aria-label": ariaLabel = "Loading",
}) {
  const dotStyle = {
    "--dot-size": `${size}px`,
    "--dot-color": color,
    "--dot-duration": `${duration}s`,
    "--dot-stagger": `${stagger}s`,
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.dotsWrapper}
        style={{
          "--dots-gap": `${gap}px`,
          "--dots-height": `${Math.max(size * 3, 24)}px`,
        }}
        aria-label={ariaLabel}
        role="status"
      >
        <div className={styles.dot} style={dotStyle} />
        <div className={styles.dot} style={dotStyle} />
        <div className={styles.dot} style={dotStyle} />
        <div className={styles.dot} style={dotStyle} />
        <div className={styles.dot} style={dotStyle} />
      </div>
    </div>
  );
}
