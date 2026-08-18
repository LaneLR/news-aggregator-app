"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./CarouselRow.module.scss";

// Shared horizontal-scroll wrapper with prev/next arrow buttons, used by
// every card carousel on the news page. Scrolling still works natively via
// touch/trackpad/scrollbar — the arrows are a discoverability aid on top.
//
// Each arrow only renders when there's actually somewhere left to scroll to
// in that direction — a row with 4 cards on a wide screen has no overflow
// at all (arrow would do nothing if clicked), and a row scrolled all the
// way to one edge no longer needs that edge's arrow either.
export default function CarouselRow({ children }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // A ResizeObserver/scroll callback can still be in flight when the
  // component unmounts (e.g. a client-side route change navigating away
  // mid-carousel) — React nulls the ref before the effect cleanup below
  // finishes detaching these listeners, so a queued callback can fire
  // against a null ref. Guard here rather than assuming cleanup always wins
  // the race.
  const updateScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // 1px tolerance for subpixel rounding right at the scroll boundaries.
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    updateScrollability();
    // Covers both causes of "how much overflow exists" changing after
    // mount: the viewport/row resizing (ResizeObserver) and cards loading
    // in asynchronously, which changes scrollWidth without resizing the
    // row itself (the children-keyed effect re-run below).
    const resizeObserver = new ResizeObserver(updateScrollability);
    resizeObserver.observe(el);
    el.addEventListener("scroll", updateScrollability);
    return () => {
      resizeObserver.disconnect();
      el.removeEventListener("scroll", updateScrollability);
    };
  }, [children, updateScrollability]);

  const scrollByPage = (direction) => {
    const el = scrollRef.current;
    el.scrollBy({ left: Math.round(el.clientWidth * 0.85) * direction, behavior: "smooth" });
  };

  return (
    <div className={styles.wrapper}>
      {canScrollLeft && (
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={() => scrollByPage(-1)}
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
      )}
      <div className={styles.row} ref={scrollRef} data-testid="carousel-scroll-row">
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={() => scrollByPage(1)}
          aria-label="Scroll right"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
