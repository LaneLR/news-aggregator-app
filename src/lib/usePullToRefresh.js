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
  const startX = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onTouchStart = useCallback(
    (e) => {
      if (window.scrollY > 0 || isRefreshing) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
    },
    [isRefreshing]
  );

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    const deltaY = e.touches[0].clientY - startY.current;
    const deltaX = e.touches[0].clientX - startX.current;
    // A carousel sitting at the very top of the page (scrollY === 0) starts
    // this same gesture on every horizontal swipe too — without this check,
    // any incidental vertical finger drift during that swipe got read as a
    // pull attempt, re-rendering PullToRefreshIndicator mid-gesture and
    // fighting the browser's own horizontal-scroll recognition. Bail out
    // for the rest of this touch the moment horizontal movement leads, the
    // same disambiguation a native pull-to-refresh gesture uses.
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      startY.current = null;
      return;
    }
    // Half-rate drag (matches the "rubber band" feel of native pull-to-
    // refresh) rather than 1:1 finger tracking, capped at MAX_PULL.
    if (deltaY > 0) setPullDistance(Math.min(deltaY * 0.5, MAX_PULL));
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
