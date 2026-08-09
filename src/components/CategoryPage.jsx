"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Newspaper, RefreshCw } from "lucide-react";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardThree from "./NewsCardThree";
import ThreePaneLayout from "./ThreePaneLayout";
import Button from "./Button";
import MarkAllReadButton from "./MarkAllReadButton";
import ViewDensityToggle from "./ViewDensityToggle";
import CardSkeleton from "./CardSkeleton";
import { useArticleShortcuts } from "@/lib/useArticleShortcuts";
import { useMarkAllRead } from "@/lib/useMarkAllRead";
import { useLayoutPrefs } from "@/lib/useLayoutPrefs";
import styles from "./CategoryPage.module.scss";

const GATED_DENSITIES = new Set(["list", "magazine"]);

async function fetchCategoryArticles(category, sort, page = 1) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/articles/${category}?sort=${sort}&page=${page}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) throw new Error("Failed to fetch news for category");

  return res.json();
}

export default function CategoryPage({
  category,
  archiveId,
  initialArticles,
  initialTotalPages,
}) {
  const { data: session } = useSession();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  const { viewDensity, setViewDensity } = useLayoutPrefs();
  const effectiveDensity = GATED_DENSITIES.has(viewDensity) && !isSubscribed ? "card" : viewDensity;
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const hasInitialArticles = Array.isArray(initialArticles);
  const [articles, setArticles] = useState(initialArticles ?? []);
  const [defaultArchiveId, setDefaultArchiveId] = useState(null);
  const [latestTimestamp, setLatestTimestamp] = useState(
    hasInitialArticles && initialArticles[0]
      ? new Date(initialArticles[0].publishedAt || initialArticles[0].updatedAt)
      : null
  );
  const [newAvailable, setNewAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(!hasInitialArticles);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(
    hasInitialArticles ? initialTotalPages || 1 : 1
  );
  // Skips exactly one upcoming mount-effect fetch when SSR already provided
  // the initial "latest" page — any later sort change still fetches normally.
  const skipNextFetch = useRef(hasInitialArticles);

  const categoryNameForDisplay =
    category.charAt(0).toUpperCase() + category.slice(1);

  const loadArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCategoryArticles(category.toLowerCase(), sort, 1);
      setArticles(data.articles);
      setPage(1);
      setTotalPages(data.totalPages || 1);
      if (data.articles.length > 0) {
        const newest = new Date(
          data.articles[0].publishedAt || data.articles[0].updatedAt
        );
        setLatestTimestamp(newest);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreArticles = async () => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchCategoryArticles(category.toLowerCase(), sort, nextPage);
      setArticles((prev) => [...prev, ...data.articles]);
      setPage(nextPage);
      setTotalPages(data.totalPages || totalPages);
    } catch (err) {
      console.error("Failed to load more articles:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (category) {
      if (skipNextFetch.current) {
        skipNextFetch.current = false;
      } else {
        loadArticles();
      }
    }

    const handleFocus = async () => {
      if (!category) return;
      try {
        const latest = await fetchCategoryArticles(category.toLowerCase(), sort, 1);
        const latestArticle = latest.articles[0];
        if (latestArticle) {
          const latestDate = new Date(
            latestArticle.publishedAt || latestArticle.updatedAt
          );
          if (latestTimestamp && latestDate > latestTimestamp) {
            setNewAvailable(true);
          }
        }
      } catch (err) {
        console.error("Failed to check for new articles:", err);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [category, sort]);

  const refreshArticles = async () => {
    setNewAvailable(false);
    await loadArticles();
  };

  const { hasUnread, markingAllRead, handleMarkAllRead } = useMarkAllRead(articles, setArticles);

  useEffect(() => {
    const fetchDefaultArchive = async () => {
      try {
        const res = await fetch("/api/archives/default");
        const data = await res.json();
        if (res.ok) {
          setDefaultArchiveId(data.archiveId);
        } else {
          console.warn("Could not get default archive:", data.error);
        }
      } catch (err) {
        console.error("Archive fetch error:", err);
      }
    };
    fetchDefaultArchive();
  }, []);

  const { selectedIndex, cardRefs } = useArticleShortcuts(
    articles,
    effectiveDensity === "reader" ? (article) => setSelectedArticleId(article.id) : undefined
  );

  const skeletonDensity = effectiveDensity === "reader" ? "list" : effectiveDensity;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={`${styles.searchBarHeader} headline`}>
          <Newspaper size={30} />
          {categoryNameForDisplay} Headlines
        </h1>
        {newAvailable && (
          <div className={styles.refreshBanner}>
            <RefreshCw size={18} />
            <Button
              bgColor={"var(--theme-primary)"}
              clr={"var(--theme-primary-contrast)"}
              onClick={refreshArticles}
            >
              New articles available
            </Button>
          </div>
        )}
      </div>

      <div className={styles.filterBar}>
        <div className={styles.sortToggle}>
          <button
            type="button"
            className={`${styles.sortOption} ${sort === "latest" ? styles.active : ""}`}
            onClick={() => setSort("latest")}
          >
            Latest
          </button>
          <button
            type="button"
            className={`${styles.sortOption} ${sort === "trending" ? styles.active : ""}`}
            onClick={() => setSort("trending")}
          >
            Trending
          </button>
          <button
            type="button"
            className={`${styles.sortOption} ${sort === "liked" ? styles.active : ""}`}
            onClick={() => setSort("liked")}
          >
            Most Liked
          </button>
        </div>
        <ViewDensityToggle density={viewDensity} onChange={setViewDensity} isSubscribed={isSubscribed} />
        {hasUnread && (
          <MarkAllReadButton onClick={handleMarkAllRead} disabled={markingAllRead} />
        )}
      </div>

      {isLoading ? (
        <NewsGridWrapper density={skeletonDensity}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} density={skeletonDensity} />
          ))}
        </NewsGridWrapper>
      ) : error ? (
        <p className={styles.caughtUpText}>Error: {error}</p>
      ) : articles.length > 0 ? (
        <>
          {effectiveDensity === "reader" ? (
            <ThreePaneLayout
              articles={articles}
              archiveId={defaultArchiveId}
              viewOnly={true}
              selectedIndex={selectedIndex}
              cardRefs={cardRefs}
              selectedArticleId={selectedArticleId}
              onSelectArticle={(article) => setSelectedArticleId(article?.id ?? null)}
            />
          ) : (
            <NewsGridWrapper density={effectiveDensity}>
              {articles.map((article, i) => (
                <NewsCardThree
                  key={article.url}
                  density={effectiveDensity}
                  article={article}
                  archiveId={defaultArchiveId}
                  viewOnly={true}
                  isKeyboardFocused={i === selectedIndex}
                  innerRef={(el) => (cardRefs.current[i] = el)}
                  index={i}
                />
              ))}
            </NewsGridWrapper>
          )}

          <div className={styles.loadMoreRow}>
            {page < totalPages ? (
              <Button
                bgColor={"var(--theme-layout-background)"}
                clr={"var(--theme-dark-blue)"}
                onClick={loadMoreArticles}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading…" : "Load More"}
              </Button>
            ) : (
              <p className={styles.caughtUpText}>You&apos;re all caught up.</p>
            )}
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <Newspaper size={32} strokeWidth={1.5} />
          <p>No articles found for {categoryNameForDisplay}.</p>
          <p className={styles.emptyStateHint}>Check back soon — new stories come in throughout the day.</p>
        </div>
      )}
    </>
  );
}
