"use client";
import Link from "next/link";
import styles from "./ArchiveCard.module.scss";

export default function ArchiveCard({ archive, children }) {
  const { name, articleCount, lastUpdated, articleImages = [] } = archive;

  const shownImages = articleImages.slice(0, 4);
  const displayImages = [
    ...shownImages,
    ...Array(4 - shownImages.length).fill(null),
  ];

  return (
    <div className={styles.cardWrapper}>
      <Link className={styles.cardLink} href={`/archives/${archive.id}`}>
        <div className={styles.imageGrid}>
          {displayImages.map((src, index) =>
            src ? (
              <div
                key={index}
                className={styles.gridImage}
                style={{ backgroundImage: `url(${src})` }}
              />
            ) : (
              <div key={index} />
            )
          )}
        </div>
        <div className={styles.overlay}>
          <h3 className={styles.archiveTitle}>{name}</h3>
          <p className={styles.archiveMeta}>
            {articleCount} Articles • {lastUpdated}
          </p>
        </div>
      </Link>
      {children && <div className={styles.cardControls}>{children}</div>}
    </div>
  );
}
