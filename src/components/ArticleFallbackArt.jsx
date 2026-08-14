import { getCategoryColor } from "@/lib/categoryColors";
import styles from "./ArticleFallbackArt.module.scss";

// Replaces the old per-category "icon on a flat color" placeholder PNGs
// (public/images/placeholders/*.png) — those read as a broken/missing image
// to anyone who's ever seen a browser's own broken-image icon, regardless of
// how deliberately the color was chosen. A plain gradient card, with the
// article's own headline as the only "art" when one's available, reads as a
// designed card instead of an error state — the same idea CarouselArticleCard
// already uses for its real photos (see its own .titleOverlay), just applied
// to the no-photo case too, and without a network request or a broken-image
// fallback chain of its own.
//
// `title` is optional: pass it to get the same scrim + headline overlay
// treatment CarouselArticleCard uses for photos; omit it where the title's
// already shown elsewhere right next to the art (e.g. the small thumbnail
// row on the shared-archive page) or handled by the consumer's own overlay
// (CarouselArticleCard itself).
export default function ArticleFallbackArt({ category, title }) {
  const color = getCategoryColor(Array.isArray(category) ? category[0] : category);

  return (
    <div
      className={styles.art}
      style={{
        background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 55%, black))`,
      }}
    >
      {title && (
        <div className={styles.titleOverlay}>
          <h3 className={`${styles.title} headline`}>{title}</h3>
        </div>
      )}
    </div>
  );
}
