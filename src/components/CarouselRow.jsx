"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./CarouselRow.module.scss";

// Shared horizontal-scroll wrapper with prev/next arrow buttons, used by
// every card carousel on the news page. Scrolling still works natively via
// touch/trackpad/scrollbar — the arrows are a discoverability aid on top.
export default function CarouselRow({ children }) {
  const scrollRef = useRef(null);

  const scrollByPage = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: Math.round(el.clientWidth * 0.85) * direction, behavior: "smooth" });
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={() => scrollByPage(-1)}
        aria-label="Scroll left"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <div className={styles.row} ref={scrollRef}>
        {children}
      </div>
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={() => scrollByPage(1)}
        aria-label="Scroll right"
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}
