"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, Lock } from "lucide-react";
import ShareButton from "./ShareButton";
import ArchiveToggleButton from "./ArchiveToggleButton";
import FollowSourceButton from "./FollowSourceButton";
import { PAYWALLED_SOURCES } from "@/lib/paywalledSources";
import { trackArticleClick } from "@/lib/trackClick";
import { getCategoryColor } from "@/lib/categoryColors";
import { timeAgo } from "@/lib/timeAgo";
import ArticleFallbackArt from "./ArticleFallbackArt";
import { useToast } from "./ToastProvider";
import styles from "./CarouselArticleCard.module.scss";

export default function CarouselCard({ article, archiveId }) {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [isLiked, setIsLiked] = useState(article.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);

  const badgeCategory = Array.isArray(article.category) ? article.category[0] : null;
  const hasRealImage = typeof article.urlToImage === "string" && article.urlToImage.trim();
  const proxiedImageUrl = hasRealImage
    ? `/api/image-proxy?url=${encodeURIComponent(article.urlToImage)}`
    : null;

  const handleLike = async () => {
    if (!session) {
      toast.info("Sign in to like articles.");
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
      toast.error("Couldn't update like status. Please try again.");
    }
  };

  const cleanSourceName =
    article.sourceName || article.source?.name || "Unknown";
  const isPaywalled = PAYWALLED_SOURCES.has(cleanSourceName);

  return (
    <div className={`${styles.cardWrapper} ${article.isRead ? styles.read : ""}`}>
      <Link className={styles.imageLink} href={`/article/${article.id}`}>
        {proxiedImageUrl ? (
          <Image
            src={proxiedImageUrl}
            alt={article.title}
            fill
            sizes="320px"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <ArticleFallbackArt category={badgeCategory} />
        )}
        {badgeCategory && (
          <span
            className={styles.categoryBadge}
            style={{ backgroundColor: getCategoryColor(badgeCategory) }}
          >
            {badgeCategory}
          </span>
        )}
        <div className={styles.titleOverlay}>
          <h3 className={`${styles.title} headline`}>{article.title}</h3>
        </div>
      </Link>
      <div className={styles.metaRow}>
        <span className={styles.sourceGroup}>
          <span className={styles.source}>{cleanSourceName}</span>
          <FollowSourceButton sourceName={cleanSourceName} />
        </span>
        <span className={styles.metaRight}>
          {isPaywalled && (
            <Lock size={12} strokeWidth={2.5} title="This source could be behind a paywall." />
          )}
          {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
        </span>
      </div>
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
            type="button"
            className={`${styles.likeButton} ${isLiked ? styles.liked : ""}`}
            onClick={handleLike}
            aria-label={isLiked ? "Unlike this article" : "Like this article"}
            aria-pressed={isLiked}
          >
            <Heart size={17} strokeWidth={2} fill={isLiked ? "currentColor" : "none"} />
            {likeCount}
          </button>
        </div>
      </div>
    </div>
  );
}
