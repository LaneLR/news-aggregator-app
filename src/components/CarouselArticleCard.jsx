"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, Lock } from "lucide-react";
import ShareButton from "./ShareButton";
import ArchiveToggleButton from "./ArchiveToggleButton";
import { PAYWALLED_SOURCES } from "@/lib/paywalledSources";
import { trackArticleClick } from "@/lib/trackClick";
import styles from "./CarouselArticleCard.module.scss";

export default function CarouselCard({ article, archiveId }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [isLiked, setIsLiked] = useState(article.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);

  const FALLBACK_IMAGE_URL = "/images/blurimage.png";
  const proxiedImageUrl = article.urlToImage
    ? `/api/image-proxy?url=${encodeURIComponent(article.urlToImage)}`
    : FALLBACK_IMAGE_URL;

  const handleLike = async () => {
    if (!session) {
      alert("You must be signed in to like articles.");
      router.push("/login");
      return;
    }
    const originalLikedState = isLiked;
    const originalLikeCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    try {
      const res = await fetch("/api/articles/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleUrl: article.url }),
      });

      if (!res.ok) {
        throw new Error("Failed to update like status");
      }
    } catch (err) {
      setIsLiked(originalLikedState);
      setLikeCount(originalLikeCount);
    }
  };

  const cleanSourceName =
    article.sourceName || article.source?.name || "Unknown";
  const isPaywalled = PAYWALLED_SOURCES.has(cleanSourceName);

  return (
    <div className={styles.cardWrapper}>
      <Link
        className={styles.imageLink}
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackArticleClick(article)}
      >
        <Image
          src={proxiedImageUrl}
          alt={article.title}
          fill
          sizes="320px"
          style={{ objectFit: "cover" }}
        />
      </Link>
      <div className={styles.contentArea}>
        <p className={styles.source}>
          {cleanSourceName}
          {isPaywalled && (
            <Lock
              className={styles.lockIcon}
              size={12}
              strokeWidth={2.5}
              title="This source could be behind a paywall."
            />
          )}
        </p>
        <h3 className={`${styles.title} headline`}>
          <Link
            className={styles.titleLink}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackArticleClick(article)}
          >
            {article.title}
          </Link>
        </h3>
        <div className={styles.actionsRow}>
          <a
            className={styles.readMoreButton}
            href={article.url}
            target="_blank"
            onClick={() => trackArticleClick(article)}
          >
            Read article
          </a>

          <div className={styles.actionsGroup}>
            <ArchiveToggleButton article={article} archiveId={archiveId} />
            <ShareButton article={article} />
            <button
              className={`${styles.likeButton} ${isLiked ? styles.liked : ""}`}
              onClick={handleLike}
            >
              <Heart size={17} strokeWidth={2} fill={isLiked ? "currentColor" : "none"} />
              {likeCount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
