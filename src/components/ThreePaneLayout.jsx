"use client";
import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import NewsCardThree from "./NewsCardThree";
import ArticleReader from "./ArticleReader";
import ReaderSkeleton from "./ReaderSkeleton";
import { useFocusTrap } from "@/lib/useFocusTrap";
import styles from "./ThreePaneLayout.module.scss";

// The "reader" view density option — a compact list pane + an inline
// reading pane, modeled on the Spotify-style list/detail layout the user
// asked for. The nav sidebar that used to live here as this layout's own
// left pane is now MainContentWrapper's persistent, always-on sidebar
// (ReaderNavSidebar) shared by every density/view, not just this one.
// Selecting an article fetches its content via /api/articles/reader/[id]
// instead of navigating away, so j/k + Enter (see useArticleShortcuts'
// onOpen param) can move through a whole category without ever leaving the
// list.
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
  const fullScreenPanelRef = useRef(null);
  useFocusTrap(fullScreenPanelRef, isFullScreen);

  // useFocusTrap's own restore-on-close targets whatever had focus right
  // before fullscreen opened (the toggle button) — but readerContent is
  // rendered in exactly one of two different parent containers depending
  // on isFullScreen (see the comment on readerContent below), so entering
  // fullscreen unmounts that button from .readingPane entirely rather than
  // just visually covering it. By the time we're closing, that original
  // button is a detached node — focusing it is a harmless no-op that sends
  // focus nowhere. This targets the *new* toggle button that remounts in
  // .readingPane once fullscreen closes.
  const wasFullScreenRef = useRef(false);
  useEffect(() => {
    if (wasFullScreenRef.current && !isFullScreen) {
      requestAnimationFrame(() => {
        document.querySelector('[aria-label="Full screen"]')?.focus();
      });
    }
    wasFullScreenRef.current = isFullScreen;
  }, [isFullScreen]);

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
            ref={fullScreenPanelRef}
            className={styles.fullScreenPanel}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Full screen article reader"
            tabIndex={-1}
          >
            {readerContent}
          </div>
        </div>
      )}
    </div>
  );
}
