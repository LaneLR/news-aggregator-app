"use client";
import ArchiveToggleButton from "./ArchiveToggleButton.jsx";
import ShareButton from "./ShareButton.jsx";
import FollowSourceButton from "./FollowSourceButton.jsx";
import Link from "next/link.js";
import Image from "next/image.js";
import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation.js";
import { Heart, Lock, Bookmark, Check, Compass, CheckSquare, Square } from "lucide-react";
import { PAYWALLED_SOURCES } from "@/lib/paywalledSources";
import { trackArticleClick } from "@/lib/trackClick";
import { getCategoryColor } from "@/lib/categoryColors";
import { useSwipeGesture } from "@/lib/useSwipeGesture";
import ArticleFallbackArt from "./ArticleFallbackArt";
import { useToast } from "./ToastProvider";
import { useLowResImage } from "@/lib/useLowResImage";
import { decodeHtmlEntities } from "@/lib/decodeHtmlEntities";
import styles from "./NewsCardThree.module.scss";

// Every card used to set `preload` (formerly `priority`) unconditionally,
// which told the browser to eagerly fetch every single article image on
// the page immediately, defeating lazy loading entirely for anything past
// the first row — a real, unnecessary bandwidth/load-time cost on category
// pages with dozens of cards. Only the first row or so is actually visible
// without scrolling on common desktop widths (the grid is a fluid
// auto-fill with a 340px minimum card width), so only those get preloaded;
// everything else keeps next/image's own default lazy loading.
const PRELOAD_THRESHOLD_INDEX = 4;
export default function NewsCardThree({
  article,
  archiveId,
  viewOnly = false,
  isKeyboardFocused = false,
  innerRef,
  density = "card",
  onSelect,
  index,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const cardRef = useRef(null);

  const [isLiked, setIsLiked] = useState(article.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);
  const [locallyRead, setLocallyRead] = useState(false);

  const setCardRef = (el) => {
    cardRef.current = el;
    if (typeof innerRef === "function") innerRef(el);
  };

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

  const badgeCategory = Array.isArray(article.category) ? article.category[0] : null;

  const rawUrl =
    typeof article?.urlToImage === "string" ? article.urlToImage.trim() : "";
  const proxiedImageUrl = rawUrl ? `/api/image-proxy?url=${encodeURIComponent(rawUrl)}` : null;

  // Covers both "never had an image" (no rawUrl) and "had one but it failed
  // to load at runtime" (imageFailed, set via onError below) — either way,
  // ArticleFallbackArt takes over instead of a broken <Image>.
  const [imageFailed, setImageFailed] = useState(false);
  const showFallbackArt = !proxiedImageUrl || imageFailed;

  const handleImageError = () => setImageFailed(true);
  const { isLowRes, handleImageLoad } = useLowResImage();

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
  const cleanTitle = decodeHtmlEntities(
    article.title?.substring(0, article.title.lastIndexOf(" - ")) ||
      article.title
  );
  const cleanSourceName = decodeHtmlEntities(
    article.sourceName || article.source?.name || "Unknown source"
  );

  const isPaywalled = PAYWALLED_SOURCES.has(cleanSourceName);

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
        ref={setCardRef}
        className={`${styles.cardContainer} ${article.isRead || locallyRead ? styles.read : ""} ${
          isKeyboardFocused ? styles.keyboardFocused : ""
        } ${density === "list" ? styles.densityList : ""} ${
          density === "magazine" ? styles.densityMagazine : ""
        }`}
        style={{
          ...(badgeCategory ? { borderTopColor: getCategoryColor(badgeCategory), borderTopWidth: "4px" } : {}),
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? "none" : "transform 0.2s ease-in-out",
        }}
      >
      <Link
        className={styles.imageLink}
        href={article.url}
        target={onSelect || selectionMode ? undefined : "_blank"}
        onClick={
          selectionMode
            ? (e) => {
                e.preventDefault();
                onToggleSelect?.();
              }
            : onSelect
            ? (e) => {
                e.preventDefault();
                onSelect();
              }
            : () => trackArticleClick(article)
        }
      >
        {showFallbackArt ? (
          <ArticleFallbackArt category={badgeCategory} title={cleanTitle} />
        ) : (
          <Image
            src={proxiedImageUrl}
            alt={article?.title || "News article image"}
            onError={handleImageError}
            onLoad={handleImageLoad}
            preload={index != null && index < PRELOAD_THRESHOLD_INDEX}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className={isLowRes ? styles.lowResImage : undefined}
            style={{
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
        )}
        {selectionMode && (
          <span className={`${styles.selectCheckbox} ${isSelected ? styles.checked : ""}`}>
            {isSelected ? (
              <CheckSquare size={20} strokeWidth={2.25} />
            ) : (
              <Square size={20} strokeWidth={2.25} />
            )}
          </span>
        )}
      </Link>
      <div className={styles.contentArea}>
        <div className={styles.titleBlock}>
          {article.recommendationReason && (
            <p className={styles.recommendationReason}>
              <Compass size={11} strokeWidth={2.5} />
              {article.recommendationReason}
            </p>
          )}
          <h3 className={`${styles.articleTitle} headline`}>
            <Link
              href={`/article/${article.id}`}
              onClick={
                onSelect
                  ? (e) => {
                      e.preventDefault();
                      onSelect();
                    }
                  : undefined
              }
            >
              {cleanTitle}
            </Link>
          </h3>
          <div className={styles.sourceRow}>
            <p className={styles.articleSnippetText}>{cleanSourceName}</p>
            <FollowSourceButton sourceName={cleanSourceName} />
          </div>
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
              data-action="like"
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
