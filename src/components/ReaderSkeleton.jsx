import styles from "./ReaderSkeleton.module.scss";

// Mirrors ArticleReader's real layout (badge, title, meta row, hero image,
// actions row, body paragraphs) so the reading pane doesn't visibly jump
// once the fetched article swaps in.
export default function ReaderSkeleton() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.article}>
        <div className={`${styles.badge} ${styles.shimmer}`} />
        <div className={`${styles.titleLine} ${styles.shimmer}`} />
        <div className={`${styles.titleLineShort} ${styles.shimmer}`} />
        <div className={styles.metaRow}>
          <div className={`${styles.metaPill} ${styles.shimmer}`} />
          <div className={`${styles.metaPillSmall} ${styles.shimmer}`} />
          <div className={`${styles.metaPillSmall} ${styles.shimmer}`} />
        </div>
        <div className={`${styles.hero} ${styles.shimmer}`} />
        <div className={styles.actionsRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${styles.actionPill} ${styles.shimmer}`} />
          ))}
        </div>
        <div className={styles.paragraphs}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`${styles.textLine} ${styles.shimmer}`}
              style={i % 3 === 2 ? { width: "65%" } : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
