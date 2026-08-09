"use client";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import NewsCardThree from "./NewsCardThree";
import ArticleReader from "./ArticleReader";
import ReaderNavSidebar from "./ReaderNavSidebar";
import ReaderSkeleton from "./ReaderSkeleton";
import styles from "./ThreePaneLayout.module.scss";

// The "reader" view density option — nav sidebar (ReaderNavSidebar) + a
// compact list pane + an inline reading pane, modeled on the
// Spotify-style library/list/detail layout the user asked for. Selecting
// an article fetches its content via /api/articles/reader/[id] instead of
// navigating away, so j/k + Enter (see useArticleShortcuts' onOpen param)
// can move through a whole category without ever leaving the list.
//
// The reading pane column has zero width until an article is selected —
// see .readingPane/.readingPaneCollapsed in the stylesheet — so with
// nothing selected the layout reads as a plain 2-pane (nav + list) view,
// centered in the available space, rather than a 3rd empty pane just
// sitting there. Selecting an article grows that column back in (and the
// nav/list panes slide left to make room) via an animated flex-basis.
export default function ThreePaneLayout({
  articles,
  archiveId,
  viewOnly,
  selectedIndex,
  cardRefs,
  selectedArticleId,
  onSelectArticle,
}) {
  const [readerData, setReaderData] = useState(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (!selectedArticleId) {
      setReaderData(null);
      // Full screen is a per-reading-session view choice, not something
      // that should still be armed the next time an article is opened.
      setIsFullScreen(false);
      return;
    }
    let cancelled = false;
    setReaderLoading(true);
    setReaderError(null);
    fetch(`/api/articles/reader/${selectedArticleId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.gated ? "This article requires a subscription." : "Couldn't load this article."
          );
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setReaderData(data);
      })
      .catch((err) => {
        if (!cancelled) setReaderError(err.message);
      })
      .finally(() => {
        if (!cancelled) setReaderLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedArticleId, retryToken]);

  useEffect(() => {
    if (!isFullScreen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullScreen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);

  // NewsCardThree's title/thumbnail links call onSelect directly (see
  // below) instead of navigating away. This wrapper-level handler is the
  // fallback for clicking blank card space that isn't a link/button — the
  // share/save/like controls and the explicit "Read article" link keep
  // their own behavior either way.
  const handleListItemClick = (event, article) => {
    if (event.target.closest("a, button")) return;
    onSelectArticle(article);
  };

  // A single JSX value rendered in exactly one of two places below — the
  // normal pane, or the full-screen overlay — never both at once. Two
  // simultaneously-mounted ArticleReader instances would each track their
  // own local like/progress state independently and drift out of sync.
  const readerContent = readerLoading ? (
    <ReaderSkeleton />
  ) : readerError ? (
    <div className={styles.emptyState}>
      <AlertCircle size={28} strokeWidth={1.5} />
      <p>{readerError}</p>
      <button
        type="button"
        className={styles.retryButton}
        onClick={() => setRetryToken((n) => n + 1)}
      >
        Try again
      </button>
    </div>
  ) : readerData ? (
    <ArticleReader
      article={readerData.article}
      sanitizedContent={readerData.sanitizedContent}
      relatedCoverage={readerData.relatedCoverage}
      readingTime={readerData.readingTime}
      onClose={() => onSelectArticle(null)}
      isFullScreen={isFullScreen}
      onToggleFullScreen={() => setIsFullScreen((prev) => !prev)}
    />
  ) : null;

  return (
    <div className={styles.threePane}>
      <div className={styles.navPane}>
        <ReaderNavSidebar />
      </div>

      <div className={`${styles.listPane} ${selectedArticleId ? styles.listPaneHidden : ""}`}>
        {articles.map((article, i) => (
          <div
            key={article.url}
            className={`${styles.listItem} ${selectedArticleId === article.id ? styles.selected : ""}`}
            onClick={(e) => handleListItemClick(e, article)}
          >
            <NewsCardThree
              article={article}
              density="list"
              archiveId={archiveId}
              viewOnly={viewOnly}
              isKeyboardFocused={i === selectedIndex}
              innerRef={(el) => (cardRefs.current[i] = el)}
              onSelect={() => onSelectArticle(article)}
              index={i}
            />
          </div>
        ))}
      </div>

      <div
        className={`${styles.readingPane} ${
          selectedArticleId ? styles.readingPaneExpanded : styles.readingPaneCollapsed
        }`}
      >
        {!isFullScreen && readerContent}
      </div>

      {isFullScreen && selectedArticleId && (
        <div className={styles.fullScreenOverlay} onClick={() => setIsFullScreen(false)}>
          <div
            className={styles.fullScreenPanel}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Full screen article reader"
          >
            {readerContent}
          </div>
        </div>
      )}
    </div>
  );
}
