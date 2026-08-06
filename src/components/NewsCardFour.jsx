"use client";
import ArchiveToggleButton from "./ArchiveToggleButton.jsx";
import Link from "next/link.js";
import Image from "next/image.js";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation.js";
import { Heart, Lock } from "lucide-react";
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
        className={styles.imageLink}
        href={article.url}
        target={"_blank"}
        onClick={() => trackArticleClick(article)}
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
          }}
        />
      </Link>
      <div className={styles.contentArea}>
        <div>
          <h3 className={`${styles.articleTitle} headline`}>
            <Link
              href={article.url}
              target={"_blank"}
              onClick={() => trackArticleClick(article)}
            >
              {cleanTitle}
            </Link>
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
