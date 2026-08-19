"use client";
import { useEffect, useRef, useState } from "react";

// Ignores sub-5px jitter (trackpad momentum, iOS's own rubber-band bounce at
// the scroll boundary) so the direction doesn't flicker between up/down on
// what's really just noise around a single scroll gesture.
const DIRECTION_NOISE_PX = 5;

// Shared by Header (hide on scroll down, reveal on scroll up — see its own
// comment on why) and BackToTopButton (shown only once scrolled down far
// enough that "back to top" is actually useful, and only while actively
// scrolling back up, matching how the header itself reappears). One
// scroll listener for both instead of two separate ones doing the same work.
export function useScrollDirection() {
  const [scrollY, setScrollY] = useState(0);
  const [direction, setDirection] = useState(null);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    setScrollY(window.scrollY);

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = Math.max(0, window.scrollY);
        const delta = currentY - lastY.current;
        if (Math.abs(delta) > DIRECTION_NOISE_PX) {
          setDirection(delta > 0 ? "down" : "up");
          lastY.current = currentY;
        }
        setScrollY(currentY);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { scrollY, direction };
}
