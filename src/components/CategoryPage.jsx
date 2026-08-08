"use client";
import { useEffect, useRef, useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardThree from "./NewsCardThree";
import Button from "./Button";
import Loading from "@/app/loading";
import { useArticleShortcuts } from "@/lib/useArticleShortcuts";
import styles from "./CategoryPage.module.scss";

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

  const { selectedIndex, cardRefs } = useArticleShortcuts(articles);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={`${styles.searchBarHeader} headline`}>
          <Newspaper size={30} />
          {categoryNameForDisplay} Headlines
        </h1>
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

      {articles.length > 0 ? (
        <>
          <NewsGridWrapper>
            {articles.map((article, i) => (
              <NewsCardThree
                key={article.url}
                article={article}
                archiveId={defaultArchiveId}
                viewOnly={true}
                isKeyboardFocused={i === selectedIndex}
                innerRef={(el) => (cardRefs.current[i] = el)}
              />
            ))}
          </NewsGridWrapper>

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
        <p>No articles found for {categoryNameForDisplay}.</p>
      )}
    </>
  );
}
