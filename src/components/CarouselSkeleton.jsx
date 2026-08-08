"use client";
import LoadingDots from "./Loading";
import styles from "./CarouselSkeleton.module.scss";

// Placeholder shown while a carousel section's articles are still loading —
// sized to match a real CarouselArticleCard's height (see
// CarouselArticleCard.module.scss) so the section doesn't jump/resize once
// real cards replace it.
export default function CarouselSkeleton() {
  return (
    <div className={styles.skeleton}>
      <LoadingDots size={10} color="var(--theme-primary)" />
    </div>
  );
}
