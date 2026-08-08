"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import NewsCardThree from "./NewsCardThree";
import ArticleReader from "./ArticleReader";
import ReaderNavSidebar from "./ReaderNavSidebar";
import Loading from "@/app/loading";
import styles from "./ThreePaneLayout.module.scss";

// The "reader" view density option — nav sidebar (ReaderNavSidebar) + a
// compact list pane + an inline reading pane, modeled on the
// Spotify-style library/list/detail layout the user asked for. Selecting
// an article fetches its content via /api/articles/reader/[id] instead of
// navigating away, so j/k + Enter (see useArticleShortcuts' onOpen param)
// can move through a whole category without ever leaving the list.
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

  useEffect(() => {
    if (!selectedArticleId) {
      setReaderData(null);
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
  }, [selectedArticleId]);

  // A click anywhere on the card that isn't a link/button (thumbnail,
  // title, and the share/save/like/read-article controls all keep their
  // own behavior) selects the article into the reading pane.
  const handleListItemClick = (event, article) => {
    if (event.target.closest("a, button")) return;
    onSelectArticle(article);
  };

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
            />
          </div>
        ))}
      </div>

      <div className={`${styles.readingPane} ${selectedArticleId ? styles.readingPaneVisible : ""}`}>
        {!selectedArticleId ? (
          <div className={styles.emptyState}>
            <p>Select an article to start reading.</p>
          </div>
        ) : (
          <>
            <button type="button" className={styles.backButton} onClick={() => onSelectArticle(null)}>
              <X size={16} strokeWidth={2} />
              Close
            </button>
            {readerLoading ? (
              <Loading />
            ) : readerError ? (
              <div className={styles.emptyState}>
                <p>{readerError}</p>
              </div>
            ) : readerData ? (
              <ArticleReader
                article={readerData.article}
                sanitizedContent={readerData.sanitizedContent}
                relatedCoverage={readerData.relatedCoverage}
                readingTime={readerData.readingTime}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
