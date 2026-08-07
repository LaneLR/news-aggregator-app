"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Lock, ExternalLink, Newspaper } from "lucide-react";
import ArchiveToggleButton from "./ArchiveToggleButton";
import ShareButton from "./ShareButton";
import { PAYWALLED_SOURCES } from "@/lib/paywalledSources";
import { trackArticleClick } from "@/lib/trackClick";
import { getCategoryColor } from "@/lib/categoryColors";
import { timeAgo } from "@/lib/timeAgo";
import styles from "./ArticleReader.module.scss";

export default function ArticleReader({ article, sanitizedContent, relatedCoverage }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [isLiked, setIsLiked] = useState(article.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);

  const cleanSourceName = article.sourceName || "Unknown source";
  const isPaywalled = PAYWALLED_SOURCES.has(cleanSourceName);
  const badgeCategory = Array.isArray(article.category) ? article.category[0] : null;

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
    const originalLiked = isLiked;
    const originalCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    try {
      const res = await fetch("/api/articles/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleUrl: article.url }),
      });
      if (!res.ok) throw new Error("Failed to update like status");
    } catch {
      setIsLiked(originalLiked);
      setLikeCount(originalCount);
    }
  };

  return (
    <div className={styles.wrapper}>
      <article className={styles.article}>
        {badgeCategory && (
          <span
            className={styles.categoryBadge}
            style={{ backgroundColor: getCategoryColor(badgeCategory) }}
          >
            {badgeCategory}
          </span>
        )}

        <h1 className={`${styles.title} headline`}>{article.title}</h1>

        <div className={styles.metaRow}>
          <span className={styles.source}>{cleanSourceName}</span>
          {isPaywalled && (
            <Lock size={13} strokeWidth={2.5} title="This source could be behind a paywall." />
          )}
          {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
        </div>

        <a
          className={styles.originalLinkTop}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackArticleClick(article)}
        >
          View original on {cleanSourceName}
          <ExternalLink size={14} strokeWidth={2} />
        </a>

        {article.urlToImage && (
          <div className={styles.heroImage}>
            <Image
              src={proxiedImageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
        )}

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={`${styles.likeButton} ${isLiked ? styles.liked : ""}`}
            onClick={handleLike}
          >
            <Heart size={17} strokeWidth={2} fill={isLiked ? "currentColor" : "none"} />
            {likeCount}
          </button>
          <ArchiveToggleButton article={article} />
          <ShareButton article={article} />
        </div>

        {sanitizedContent ? (
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        ) : (
          <div className={styles.noContent}>
            <p>
              This source doesn&apos;t include full article text in its feed —
              here&apos;s what we have. Read the rest at the original source.
            </p>
          </div>
        )}

        <a
          className={styles.originalLinkBottom}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackArticleClick(article)}
        >
          Read the full article on {cleanSourceName}
          <ExternalLink size={15} strokeWidth={2} />
        </a>
      </article>

      {relatedCoverage.length > 0 && (
        <aside className={styles.relatedSection}>
          <h2 className={styles.relatedHeader}>
            <Newspaper size={16} strokeWidth={2} />
            Also covered by other sources
          </h2>
          <ul className={styles.relatedList}>
            {relatedCoverage.map((related) => (
              <li key={related.id}>
                <Link href={`/article/${related.id}`} className={styles.relatedLink}>
                  <span className={styles.relatedSource}>
                    {related.sourceName || "Unknown source"}
                  </span>
                  <span className={styles.relatedTitle}>{related.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
