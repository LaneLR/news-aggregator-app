"use client";
import { useEffect, useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardThree from "./NewsCardThree";
import Button from "./Button";
import Loading from "@/app/loading";
import styles from "./CategoryPage.module.scss";

async function fetchCategoryArticles(category, sort) {
  const baseUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/articles/${category}?sort=${sort}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) throw new Error("Failed to fetch news for category");

  const data = await res.json();
  return data.articles;
}

export default function CategoryPage({ category, archiveId }) {
  const [articles, setArticles] = useState([]);
  const [defaultArchiveId, setDefaultArchiveId] = useState(null);
  const [latestTimestamp, setLatestTimestamp] = useState(null);
  const [newAvailable, setNewAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("latest");

  const categoryNameForDisplay =
    category.charAt(0).toUpperCase() + category.slice(1);

  const loadArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCategoryArticles(category.toLowerCase(), sort);
      setArticles(data);
      if (data.length > 0) {
        const newest = new Date(data[0].publishedAt || data[0].updatedAt);
        setLatestTimestamp(newest);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (category) {
      loadArticles();
    }

    const handleFocus = async () => {
      if (!category) return;
      try {
        const latest = await fetchCategoryArticles(category.toLowerCase(), sort);
        const latestArticle = latest[0];
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
        <NewsGridWrapper>
          {articles.map((article) => (
            <NewsCardThree
              key={article.url}
              article={article}
              archiveId={defaultArchiveId}
              viewOnly={true}
            />
          ))}
        </NewsGridWrapper>
      ) : (
        <p>No articles found for {categoryNameForDisplay}.</p>
      )}
    </>
  );
}
