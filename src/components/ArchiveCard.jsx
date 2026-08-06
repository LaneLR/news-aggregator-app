"use client";
import Link from "next/link";
import { Image as ImageIcon, FileText } from "lucide-react";
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
              <div key={index} className={styles.emptySlot}>
                <ImageIcon size={20} strokeWidth={1.5} />
              </div>
            )
          )}
        </div>
        <div className={styles.overlay}>
          <h3 className={`${styles.archiveTitle} headline`}>{name}</h3>
          <p className={styles.archiveMeta}>
            <FileText size={14} />
            {articleCount} Articles • {lastUpdated}
          </p>
        </div>
      </Link>
      {children && <div className={styles.cardControls}>{children}</div>}
    </div>
  );
}
