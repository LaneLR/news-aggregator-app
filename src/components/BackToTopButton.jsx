"use client";
import { ArrowUp } from "lucide-react";
import { useScrollDirection } from "@/lib/useScrollDirection";
import styles from "./BackToTopButton.module.scss";

// Only worth showing once scrolled far enough that "back to top" actually
// saves a meaningful scroll — much lower than this and the gesture it's
// meant to save (scrolling to the top by hand) is barely any faster anyway.
const REVEAL_THRESHOLD_PX = 600;

// Appears specifically while scrolling back up past REVEAL_THRESHOLD_PX —
// not just "whenever scrolled down far" — matching how the header itself
// reappears on the same upward gesture (see Header.jsx), so the two read as
// one consistent "you're heading back up" signal rather than a button that's
// just always sitting there once you've scrolled a bit.
export default function BackToTopButton() {
  const { scrollY, direction } = useScrollDirection();
  const isVisible = direction === "up" && scrollY > REVEAL_THRESHOLD_PX;

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      className={`${styles.button} ${isVisible ? styles.visible : ""}`}
      onClick={handleClick}
      aria-label="Back to top"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
    >
      <ArrowUp size={20} strokeWidth={2.5} />
    </button>
  );
}
