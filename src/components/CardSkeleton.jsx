import styles from "./CardSkeleton.module.scss";

const DENSITY_CLASS = {
  list: styles.densityList,
  magazine: styles.densityMagazine,
};

// Mirrors NewsCardThree's real layout per density (see that component's
// .cardContainer/.imageLink/.contentArea) so swapping the skeleton for real
// cards once data arrives doesn't shift the page.
export default function CardSkeleton({ density = "card" }) {
  return (
    <div className={`${styles.cardContainer} ${DENSITY_CLASS[density] || ""}`}>
      <div className={`${styles.image} ${styles.shimmer}`} />
      <div className={styles.contentArea}>
        <div className={styles.titleBlock}>
          <div className={`${styles.line} ${styles.lineTitle} ${styles.shimmer}`} />
          <div className={`${styles.line} ${styles.lineTitleShort} ${styles.shimmer}`} />
          <div className={`${styles.line} ${styles.lineSource} ${styles.shimmer}`} />
        </div>
        <div className={styles.actionsRow}>
          <div className={`${styles.pill} ${styles.shimmer}`} />
          <div className={styles.iconGroup}>
            <div className={`${styles.iconDot} ${styles.shimmer}`} />
            <div className={`${styles.iconDot} ${styles.shimmer}`} />
            <div className={`${styles.iconDot} ${styles.shimmer}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
