"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import ArchiveToggleButton from "./ArchiveToggleButton";
import { trackArticleClick } from "@/lib/trackClick";
import styles from "./NewsCard.module.scss";

export default function NewsCard({ article, archiveId, viewOnly = false }) {
  const FALLBACK_IMAGE_URL = "/images/NoImage.png";
  const index = article.title.lastIndexOf(" - ");
  const cleanTitle =
    index !== -1 ? article.title.substring(0, index) : article.title;

  const [currentImageSrc, setCurrentImageSrc] = useState(() => {
    return article.urlToImage &&
      typeof article.urlToImage === "string" &&
      article.urlToImage.trim() !== ""
      ? article.urlToImage
      : FALLBACK_IMAGE_URL;
  });

  useEffect(() => {
    setCurrentImageSrc((prevSrc) => {
      const newSrc =
        article.urlToImage &&
        typeof article.urlToImage === "string" &&
        article.urlToImage.trim() !== ""
          ? article.urlToImage
          : FALLBACK_IMAGE_URL;
      return newSrc !== prevSrc ? newSrc : prevSrc;
    });
  }, [article.urlToImage]);

  const handleImageError = () => {
    if (currentImageSrc !== FALLBACK_IMAGE_URL) {
      console.warn(`Image failed to load: ${currentImageSrc}. Using fallback.`);
      setCurrentImageSrc(FALLBACK_IMAGE_URL);
    }
  };

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.cardWrapper}>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackArticleClick(article)}
          >
            <Image
              style={{
                borderTopLeftRadius: "15px",
                borderTopRightRadius: "10px",
                backgroundColor:
                  currentImageSrc === FALLBACK_IMAGE_URL
                    ? "lightgray"
                    : "#f0f0f0",
                objectFit: "cover",
              }}
              src={currentImageSrc}
              fill
              alt={article.title || "News article image"}
              onError={handleImageError}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
            />
          </a>
        </div>
        <div className={styles.descriptionSection}>
          <div className={styles.titleSection}>{cleanTitle}</div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "95%",
            }}
          >
            <div className={styles.authorSection}>
              {article.sourceName || article.source?.name || "Unknown source"}
            </div>
            <ArchiveToggleButton
              article={article}
              archiveId={archiveId}
              viewOnly={viewOnly}
            />
          </div>
        </div>
      </div>
    </>
  );
}
