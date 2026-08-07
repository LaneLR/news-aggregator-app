"use client";
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardThree from "./NewsCardThree";
import styles from "./SearchFeed.module.scss";

export default function SearchFeed({ initialQuery, archiveId, viewOnly }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef();

  useEffect(() => {
    // Reset state if query changes
    setResults([]);
    setPage(1);
    setHasMore(true);
  }, [query]);

  useEffect(() => {
    const fetchArticles = async () => {
      if (!query || loading || !hasMore) return;

      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?query=${encodeURIComponent(query)}&page=${page}`
        );
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
          setHasMore(false);
        } else {
          setResults((prev) => {
            const existingUrls = new Set(prev.map((a) => a.url));
            const newUniqueArticles = data.results.filter(
              (a) => !existingUrls.has(a.url)
            );
            return [...prev, ...newUniqueArticles];
          });
        }
      } catch (err) {
        console.error("Failed to load articles:", err);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [query, page]);

  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "150px" }
    );

    const current = observerRef.current;
    observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasMore, loading]);

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={`${styles.pageTitle} headline`}>
          <Search size={26} strokeWidth={2} />
          Search Results
        </h1>
        <p className={styles.pageSubtitle}>
          {query ? `Showing results for "${query}"` : "Results"}
        </p>
      </div>

      {results.length > 0 && (
        <NewsGridWrapper>
          {results.map((article, i) => (
            <NewsCardThree
              key={i}
              article={article}
              archiveId={archiveId}
              viewOnly={viewOnly}
            />
          ))}
        </NewsGridWrapper>
      )}

      {!loading && results.length === 0 && !hasMore && (
        <div className={styles.emptyState}>
          <Search size={32} strokeWidth={1.5} />
          <p>No results found for &quot;{query}&quot;.</p>
          <p className={styles.emptyStateHint}>
            Try a different search term or check the spelling.
          </p>
        </div>
      )}

      <div ref={observerRef} className={styles.sentinel} />
      {loading && <p className={styles.statusText}>Loading more...</p>}
      {!hasMore && results.length > 0 && (
        <p className={styles.statusText}>No more results</p>
      )}
    </>
  );
}
