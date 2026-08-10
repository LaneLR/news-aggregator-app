"use client";
import { useCallback, useRef, useState } from "react";

const PULL_THRESHOLD = 70;
const MAX_PULL = 120;

// Touch-only, same convention as useSwipeGesture — desktop already has a
// dedicated refresh path (the "New articles available" banner). Only
// starts tracking when the page is already scrolled to the very top, so an
// ordinary downward scroll mid-feed never gets mistaken for a pull.
export function usePullToRefresh(onRefresh) {
  const startY = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onTouchStart = useCallback(
    (e) => {
      if (window.scrollY > 0 || isRefreshing) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    },
    [isRefreshing]
  );

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    // Half-rate drag (matches the "rubber band" feel of native pull-to-
    // refresh) rather than 1:1 finger tracking, capped at MAX_PULL.
    if (delta > 0) setPullDistance(Math.min(delta * 0.5, MAX_PULL));
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (startY.current === null) return;
    startY.current = null;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    pullHandlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
