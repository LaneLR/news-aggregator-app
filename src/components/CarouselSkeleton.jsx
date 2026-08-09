import styles from "./CarouselSkeleton.module.scss";

const CARD_COUNT = 4;

// Placeholder shown while a carousel section's articles are still loading —
// shaped and sized to match a row of real CarouselArticleCards (see that
// component's .cardWrapper) so the section doesn't jump/resize once real
// cards replace it, and reads as "cards are coming" rather than one flat,
// static gray box.
export default function CarouselSkeleton() {
  return (
    <div className={styles.row}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <div className={styles.card} key={i}>
          <div className={`${styles.image} ${styles.shimmer}`} />
          <div className={styles.body}>
            <div className={`${styles.line} ${styles.lineTitle} ${styles.shimmer}`} />
            <div className={`${styles.line} ${styles.lineTitleShort} ${styles.shimmer}`} />
            <div className={styles.metaRow}>
              <div className={`${styles.line} ${styles.lineSource} ${styles.shimmer}`} />
              <div className={`${styles.line} ${styles.lineMeta} ${styles.shimmer}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
