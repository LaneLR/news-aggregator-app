"use client";
import ArchiveToggleButton from "./ArchiveToggleButton.jsx";
import Link from "next/link.js";
import Image from "next/image.js";
import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation.js";
import { Heart, Lock, Bookmark, Check } from "lucide-react";
import ShareButton from "./ShareButton.jsx";
import { PAYWALLED_SOURCES } from "@/lib/paywalledSources";
import { trackArticleClick } from "@/lib/trackClick";
import { getCategoryColor } from "@/lib/categoryColors";
import { useSwipeGesture } from "@/lib/useSwipeGesture";
import ArticleFallbackArt from "./ArticleFallbackArt";
import { useToast } from "./ToastProvider";
import styles from "./NewsCardFour.module.scss";

export default function NewsCardFour({
  article,
  archiveId,
  viewOnly = false,
  index,
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const cardRef = useRef(null);

  const [isLiked, setIsLiked] = useState(article.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);
  const [locallyRead, setLocallyRead] = useState(false);

  const handleSwipeSave = () => {
    cardRef.current?.querySelector('[data-action="save"]')?.click();
  };

  const handleSwipeMarkRead = () => {
    if (!session?.user?.id || article.isRead || locallyRead) return;
    setLocallyRead(true);
    fetch("/api/articles/mark-all-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: [article.url] }),
    }).catch((err) => console.error("Failed to mark article as read:", err));
  };

  const { offsetX, isSwiping, swipeHandlers } = useSwipeGesture({
    onSwipeLeft: handleSwipeMarkRead,
    onSwipeRight: handleSwipeSave,
  });

  const rawUrl =
    typeof article?.urlToImage === "string" ? article.urlToImage.trim() : "";
  const proxiedImageUrl = rawUrl ? `/api/image-proxy?url=${encodeURIComponent(rawUrl)}` : null;

  // Covers both "never had an image" (no rawUrl) and "had one but it failed
  // to load at runtime" (imageFailed, set via onError below) — either way,
  // ArticleFallbackArt takes over instead of a broken <Image>.
  const [imageFailed, setImageFailed] = useState(false);
  const showFallbackArt = !proxiedImageUrl || imageFailed;

  const handleImageError = () => setImageFailed(true);

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
  const cleanTitle =
    article.title?.substring(0, article.title.lastIndexOf(" - ")) ||
    article.title;
  const cleanSourceName =
    article.sourceName || article.source?.name || "Unknown source";

  const isPaywalled = PAYWALLED_SOURCES.has(cleanSourceName);
  const badgeCategory = Array.isArray(article.category) ? article.category[0] : null;

  return (
    <div
      className={styles.swipeWrapper}
      style={index != null ? { animationDelay: `${Math.min(index, 10) * 35}ms` } : undefined}
      {...swipeHandlers}
    >
      <div
        className={`${styles.swipeHint} ${offsetX !== 0 ? styles.visible : ""} ${
          offsetX > 0 ? styles.swipeHintSave : styles.swipeHintRead
        }`}
        style={{ opacity: Math.min(Math.abs(offsetX) / 80, 1) }}
      >
        {offsetX > 0 ? (
          <>
            <Bookmark size={20} strokeWidth={2} />
            Save
          </>
        ) : (
          <>
            <Check size={20} strokeWidth={2} />
            Mark read
          </>
        )}
      </div>
      <div
        ref={cardRef}
        className={`${styles.cardContainer} ${article.isRead || locallyRead ? styles.read : ""}`}
        style={{
          ...(badgeCategory ? { borderTopColor: getCategoryColor(badgeCategory), borderTopWidth: "4px" } : {}),
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? "none" : "transform 0.2s ease-in-out",
        }}
      >
      <Link
        className={styles.imageLink}
        href={article.url}
        target={"_blank"}
        onClick={() => trackArticleClick(article)}
      >
        {showFallbackArt ? (
          <ArticleFallbackArt category={badgeCategory} title={cleanTitle} />
        ) : (
          <Image
            src={proxiedImageUrl}
            alt={article?.title || "News article image"}
            onError={handleImageError}
            priority
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            style={{
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
        )}
      </Link>
      <div className={styles.contentArea}>
        <div className={styles.titleBlock}>
          <h3 className={`${styles.articleTitle} headline`}>
            <Link href={`/article/${article.id}`}>{cleanTitle}</Link>
          </h3>
          <p className={styles.articleSnippetText}>{cleanSourceName}</p>
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
            {isPaywalled && (
              <span className={styles.lockedArticleIcon} title="This article may be behind a paywall">
                <Lock size={15} strokeWidth={2} />
              </span>
            )}
            <ShareButton article={article} />
            <ArchiveToggleButton
              article={article}
              archiveId={archiveId}
              viewOnly={viewOnly}
            />
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
      </div>
    </div>
  );
}
