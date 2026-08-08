"use client";
import { useRef, useState } from "react";

const SWIPE_THRESHOLD = 80;
const MAX_DRAG = 120;

// Touch-only (no mouse handlers) — desktop pointer users already have
// dedicated save/like buttons and keyboard shortcuts, so this only engages
// on the touch devices where swipe is the expected interaction.
export function useSwipeGesture({ onSwipeLeft, onSwipeRight }) {
  const startX = useRef(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const onTouchMove = (e) => {
    if (startX.current === null) return;
    const delta = e.touches[0].clientX - startX.current;
    setOffsetX(Math.max(-MAX_DRAG, Math.min(MAX_DRAG, delta)));
  };

  const onTouchEnd = () => {
    if (offsetX <= -SWIPE_THRESHOLD) {
      onSwipeLeft?.();
    } else if (offsetX >= SWIPE_THRESHOLD) {
      onSwipeRight?.();
    }
    setOffsetX(0);
    setIsSwiping(false);
    startX.current = null;
  };

  return {
    offsetX,
    isSwiping,
    swipeHandlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
