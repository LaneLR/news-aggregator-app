"use client";
import ArchiveToggleButton from "./ArchiveToggleButton.jsx";
import Link from "next/link.js";
import Image from "next/image.js";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation.js";
import ShareButton from "./ShareButton.jsx";
import { PAYWALLED_SOURCES } from "@/lib/paywalledSources";
import { trackArticleClick } from "@/lib/trackClick";
import styles from "./NewsCardFour.module.scss";

export default function NewsCardFour({
  article,
  archiveId,
  viewOnly = false,
}) {
  const { data: session } = useSession();
  const router = useRouter();

  const [isLiked, setIsLiked] = useState(article.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);

  const FALLBACK_IMAGE_URL = "/images/morningfeedsplaceholder.png";

  const rawUrl =
    typeof article?.urlToImage === "string" ? article.urlToImage.trim() : "";

  const proxiedImageUrl = rawUrl
    ? `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`
    : FALLBACK_IMAGE_URL;

  const [imageSrc, setImageSrc] = useState(proxiedImageUrl);

  const handleImageError = () => setImageSrc(FALLBACK_IMAGE_URL);

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
      alert("There was an error. Please try again.");
    }
  };
  const cleanTitle =
    article.title?.substring(0, article.title.lastIndexOf(" - ")) ||
    article.title;
  const cleanSourceName =
    article.sourceName || article.source?.name || "Unknown source";

  const isPaywalled = PAYWALLED_SOURCES.has(cleanSourceName);

  return (
    <div className={styles.cardContainer}>
      <Link
        href={article.url}
        target={"_blank"}
        onClick={() => trackArticleClick(article)}
        style={{ position: "relative", width: "100%", height: "250px" }}
      >
        <Image
          src={imageSrc}
          alt={article?.title || "News article image"}
          onError={handleImageError}
          priority
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          style={{
            objectFit: "cover",
            objectPosition: "top",
            borderBottom: `1px solid var(--theme-border)`,
            minWidth: "100%",
            borderTopLeftRadius: "10px",
            borderTopRightRadius: "10px",
          }}
        />
      </Link>
      <div className={styles.contentArea}>
        <div>
          {" "}
          <div className={styles.articleSnippet}>
            <p className={styles.articleSnippetText}>{cleanSourceName}</p>
          </div>
          <h3 className={styles.articleTitle}>
            <Link
              href={article.url}
              target={"_blank"}
              onClick={() => trackArticleClick(article)}
            >
              {cleanTitle}
            </Link>
          </h3>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 0 10px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <a
              className={styles.readMoreButton}
              href={article.url}
              target="_blank"
              onClick={() => trackArticleClick(article)}
            >
              Read article
            </a>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              gap: "6px",
            }}
          >
            {isPaywalled && (
              <span title="This article may be behind a paywall">
                <img
                  className={styles.lockedArticleSvg}
                  src="/images/lock.svg"
                  alt="Image may be behind a paywall"
                />
              </span>
            )}
            <ShareButton article={article} />
            <ArchiveToggleButton
              article={article}
              archiveId={archiveId}
              viewOnly={viewOnly}
            />
            <button
              className={`${styles.likeButton} ${isLiked ? styles.liked : ""}`}
              onClick={handleLike}
            >
              {isLiked ? (
                <img
                  className={styles.likeOrUnlikedButton}
                  src="/images/like-button-liked.svg"
                  alt="Article liked button"
                />
              ) : (
                <img
                  className={styles.likeOrUnlikedButton}
                  src="/images/like-button-unliked.svg"
                  alt="Article not liked button"
                />
              )}
              <div className={styles.likeCountCounter}>{likeCount}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
