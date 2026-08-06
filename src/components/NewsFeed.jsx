"use client";
import { useEffect, useState } from "react";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardFour from "./NewsCardFour";
import Button from "./Button";
import Loading from "@/app/loading";
import styles from "./NewsFeed.module.scss";

async function fetchArticles(feedId) {
  const baseUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const url = feedId
    ? `${baseUrl}/api/feeds/${feedId}/articles`
    : `${baseUrl}/api/fetched`;

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
          if (latestTimestamp && latestDate > latestTimestamp) {
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div className={styles.searchBarHeader}>The most recent headlines</div>
        {newAvailable && (
          <div
            style={{
              margin: "20px 0 0 0",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "1.6rem" }}>🔄</div>
            <Button
              bgColor={"var(--primary-blue)"}
              clr={"var(--white)"}
              onClick={refreshArticles}
            >
              New articles available
            </Button>
          </div>
        )}
      </div>

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
