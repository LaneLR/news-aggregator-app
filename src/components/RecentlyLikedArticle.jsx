"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackArticleClick } from "@/lib/trackClick";
import styles from "./RecentlyLikedArticle.module.scss";

const FALLBACK_IMAGE_URL = "/images/blurimage.png";

export default function RecentlyLikedItem({ article }) {
  const rawUrl =
    typeof article?.urlToImage === "string" ? article.urlToImage.trim() : "";

  const proxiedImageUrl = rawUrl
    ? `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`
    : FALLBACK_IMAGE_URL;

  const [imageSrc, setImageSrc] = useState(proxiedImageUrl);
  const handleImageError = () => setImageSrc(FALLBACK_IMAGE_URL);

  return (
    <li>
      <Link
        className={styles.itemLink}
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackArticleClick(article)}
      >
        <Image
          className={styles.thumbnail}
          src={imageSrc}
          width={70}
          height={70}
          alt={article.title}
          onError={handleImageError}
        />
        <div className={styles.info}>
          <h4>{article.title}</h4>
          <p>{article.sourceName}</p>
        </div>
      </Link>
    </li>
  );
}
