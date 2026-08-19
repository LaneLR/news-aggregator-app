"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Lock, ExternalLink, Newspaper, X, Maximize2, Minimize2, ArrowLeft } from "lucide-react";
import ArchiveToggleButton from "./ArchiveToggleButton";
import ShareButton from "./ShareButton";
import ReaderCustomizationPanel from "./ReaderCustomizationPanel";
import TextToSpeechButton from "./TextToSpeechButton";
import { PAYWALLED_SOURCES } from "@/lib/paywalledSources";
import { trackArticleClick } from "@/lib/trackClick";
import { getCategoryColor } from "@/lib/categoryColors";
import { timeAgo } from "@/lib/timeAgo";
import { useReaderPrefs, readerPrefsToCssVars } from "@/lib/readerPrefs";
import { decodeHtmlEntities } from "@/lib/decodeHtmlEntities";
import { useToast } from "./ToastProvider";
import styles from "./ArticleReader.module.scss";

function extractPlainText(html) {
  if (typeof window === "undefined" || !html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

export default function ArticleReader({
  article,
  sanitizedContent,
  relatedCoverage,
  readingTime,
  onClose,
  isFullScreen,
  onToggleFullScreen,
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  const [isLiked, setIsLiked] = useState(article.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);
  const { prefs, updatePrefs, resetPrefs } = useReaderPrefs();
  const articleRef = useRef(null);
  const [readProgress, setReadProgress] = useState(0);

  // Both the standalone article page and the 3-pane reader's reading pane
  // scroll the window itself (the pane has no overflow/max-height of its
  // own — see ThreePaneLayout.module.scss), so a single window scroll
  // listener covers both contexts without needing to know which one this is.
  useEffect(() => {
    const handleScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) {
        setReadProgress(100);
        return;
      }
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setReadProgress((scrolled / total) * 100);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [sanitizedContent]);

  const cleanTitle = decodeHtmlEntities(article.title);

  const speechText = useMemo(() => {
    const bodyText = extractPlainText(sanitizedContent);
    return [cleanTitle, bodyText].filter(Boolean).join(". ");
  }, [cleanTitle, sanitizedContent]);

  const cleanSourceName = decodeHtmlEntities(article.sourceName || "Unknown source");
  const isPaywalled = PAYWALLED_SOURCES.has(cleanSourceName);
  const badgeCategory = Array.isArray(article.category) ? article.category[0] : null;

  const handleLike = async () => {
    if (!session) {
      toast.info("Sign in to like articles.");
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

  // The 3-pane reader already has its own exit affordance (onClose, closing
  // it back into the list pane it opened from) — this is only for the
  // standalone /article/[id] page, which has neither onClose nor
  // onToggleFullScreen and previously had no way back except the browser's
  // own chrome. router.back() (rather than a fixed href like /news) both
  // returns to whatever page actually linked here and, being a real
  // history-stack pop rather than a fresh navigation, gets the browser's
  // native scroll-position restoration for free — the feed picks up
  // exactly where the reader left it instead of resetting to the top.
  const showBackButton = !onClose;

  return (
    <div className={styles.wrapper} style={readerPrefsToCssVars(prefs)}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${readProgress}%` }} />
      </div>
      <article className={styles.article} ref={articleRef}>
        {(showBackButton || badgeCategory || onToggleFullScreen || onClose) && (
          <div className={styles.headerRow}>
            {showBackButton && (
              <button
                type="button"
                className={styles.backButton}
                onClick={() => router.back()}
                aria-label="Back"
              >
                <ArrowLeft size={17} strokeWidth={2.25} />
                Back
              </button>
            )}
            {badgeCategory && (
              <span
                className={styles.categoryBadge}
                style={{ backgroundColor: getCategoryColor(badgeCategory) }}
              >
                {badgeCategory}
              </span>
            )}
            {(onToggleFullScreen || onClose) && (
              <div className={styles.headerActions}>
                {onToggleFullScreen && (
                  <button
                    type="button"
                    className={styles.iconActionButton}
                    onClick={onToggleFullScreen}
                    title={isFullScreen ? "Exit full screen" : "Full screen"}
                    aria-label={isFullScreen ? "Exit full screen" : "Full screen"}
                  >
                    {isFullScreen ? (
                      <Minimize2 size={17} strokeWidth={2} />
                    ) : (
                      <Maximize2 size={17} strokeWidth={2} />
                    )}
                  </button>
                )}
                {onClose && (
                  <button
                    type="button"
                    className={styles.iconActionButton}
                    onClick={onClose}
                    title="Close"
                    aria-label="Close"
                  >
                    <X size={18} strokeWidth={2} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <h1 className={`${styles.title} headline`}>{cleanTitle}</h1>

        <div className={styles.metaRow}>
          <span className={styles.source}>{cleanSourceName}</span>
          {isPaywalled && (
            <Lock size={13} strokeWidth={2.5} title="This source could be behind a paywall." />
          )}
          {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
          {readingTime && <span>{readingTime} min read</span>}
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
              src={`/api/image-proxy?url=${encodeURIComponent(article.urlToImage)}`}
              alt={cleanTitle}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              style={{ objectFit: "cover" }}
              preload
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
          <TextToSpeechButton text={speechText} isSubscribed={isSubscribed} />
          <span className={styles.actionsSpacer} />
          <ReaderCustomizationPanel prefs={prefs} onChange={updatePrefs} onReset={resetPrefs} />
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
                    {decodeHtmlEntities(related.sourceName) || "Unknown source"}
                  </span>
                  <span className={styles.relatedTitle}>{decodeHtmlEntities(related.title)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
