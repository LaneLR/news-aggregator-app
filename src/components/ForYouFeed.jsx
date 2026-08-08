"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardThree from "./NewsCardThree";
import Loading from "@/app/loading";
import { useArticleShortcuts } from "@/lib/useArticleShortcuts";
import styles from "./ForYouFeed.module.scss";

async function fetchRecommendations() {
  const res = await fetch("/api/recommendations");
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  const data = await res.json();
  return data.articles;
}

export default function ForYouFeed() {
  const [articles, setArticles] = useState([]);
  const [defaultArchiveId, setDefaultArchiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        setArticles(await fetchRecommendations());
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchDefaultArchive = async () => {
      try {
        const res = await fetch("/api/archives/default");
        const data = await res.json();
        if (res.ok) setDefaultArchiveId(data.archiveId);
      } catch (err) {
        console.error("Archive fetch error:", err);
      }
    };
    fetchDefaultArchive();
  }, []);

  const { selectedIndex, cardRefs } = useArticleShortcuts(articles);

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={`${styles.pageTitle} headline`}>
          <Sparkles size={26} strokeWidth={2} />
          For You
        </h1>
        <p className={styles.pageSubtitle}>
          Picked based on the sources, categories, and articles you&apos;ve
          liked, saved, and clicked on.
        </p>
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <p className={styles.statusText}>Error: {error}</p>
      ) : articles.length > 0 ? (
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
      ) : (
        <div className={styles.emptyState}>
          <Sparkles size={32} strokeWidth={1.5} />
          <p>Nothing tailored just yet.</p>
          <p className={styles.emptyStateHint}>
            Like, save, or click a few articles and check back here —
            we&apos;ll start tailoring this feed to you.
          </p>
        </div>
      )}
    </>
  );
}
