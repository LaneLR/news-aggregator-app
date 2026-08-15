"use client";
import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardFour from "./NewsCardFour";
import Button from "./Button";
import Loading from "@/app/loading";
import styles from "./NewsFeed.module.scss";

// A relative path, not NEXT_PUBLIC_BASE_URL — see the identical comment in
// CategoryPage.jsx's fetchCategoryArticles for why: this runs in the
// browser, where a relative fetch already resolves against the current
// origin, and the env-var version would silently break in any deployment
// where that build-time value doesn't match reality.
async function fetchArticles(feedId) {
  const url = feedId ? `/api/feeds/${feedId}/articles` : `/api/fetched`;

  const res = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error("Failed to fetch articles");

  const data = await res.json();
  return data.articles;
}

export default function News({ archiveId, feedId }) {
  const [articles, setArticles] = useState([]);
  const [defaultArchiveId, setDefaultArchiveId] = useState(null);
  const [latestTimestamp, setLatestTimestamp] = useState(null);
  const [newAvailable, setNewAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  // Bug fix: handleFocus (below) is defined once inside an effect whose
  // dependency array is only [feedId], so it closed over `latestTimestamp`
  // from the render that effect ran in — which is always its initial value
  // of `null`, since the effect never re-runs as latestTimestamp changes.
  // That made `latestTimestamp && latestDate > latestTimestamp` permanently
  // false, so the "new articles available" banner could never appear.
  // Mirroring the value into a ref lets handleFocus read the current value
  // without needing the effect (and its focus listener) to be re-created
  // on every update.
  const latestTimestampRef = useRef(null);
  useEffect(() => {
    latestTimestampRef.current = latestTimestamp;
  }, [latestTimestamp]);

  useEffect(() => {
    const loadInitialArticles = async () => {
      setLoading(true);
      try {
        const data = await fetchArticles(feedId);
        setArticles(data);
        if (data.length > 0) {
          const newest = new Date(data[0].publishedAt || data[0].updatedAt);
          setLatestTimestamp(newest);
        }
      } catch (err) {
        console.error("Failed to load articles:", err);
      } finally {
        setLoading(false);
      }
    };

    const handleFocus = async () => {
      try {
        const latest = await fetchArticles(feedId);
        const latestArticle = latest[0];
        if (latestArticle) {
          const latestDate = new Date(
            latestArticle.publishedAt || latestArticle.updatedAt
          );
          const currentLatestTimestamp = latestTimestampRef.current;
          if (currentLatestTimestamp && latestDate > currentLatestTimestamp) {
            setNewAvailable(true);
          }
        }
      } catch (err) {
        console.error("Failed to check for new articles:", err);
      }
    };

    loadInitialArticles();
    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, [feedId]);

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

  const refreshArticles = async () => {
    setNewAvailable(false);
    setLoading(true);
    try {
      const data = await fetchArticles(feedId);
      setArticles(data);
      if (data.length > 0) {
        const newest = new Date(data[0].publishedAt || data[0].updatedAt);
        setLatestTimestamp(newest);
      }
    } catch (err) {
      console.error("Failed to refresh articles:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {newAvailable && (
        <div className={styles.refreshBanner}>
          <RefreshCw size={18} strokeWidth={2} />
          <Button
            bgColor={"var(--theme-primary)"}
            clr={"var(--theme-primary-contrast)"}
            onClick={refreshArticles}
          >
            New articles available
          </Button>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <NewsGridWrapper>
          {articles.map((article) => (
            <NewsCardFour
              key={article.url}
              article={article}
              archiveId={defaultArchiveId}
              viewOnly={true}
            />
          ))}
        </NewsGridWrapper>
      )}
    </>
  );
}
