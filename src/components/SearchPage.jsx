"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import NewsCard from "./NewsCard";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardThree from "./NewsCardThree";
import { usePathname } from "next/navigation";

const FeedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 20px;
`;

export default function SearchFeed({ initialQuery, article, archiveId, viewOnly }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const observerRef = useRef();

  useEffect(() => {
    const fetchArticles = async () => {
      if (!query || loading || !hasMore) return;

      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?query=${encodeURIComponent(query)}&page=${page}`
        );
        const data = await res.json();

        if (data.results.length === 0) {
          setHasMore(false);
        } else {
          setResults((prev) => [...prev, ...data.results]);
        }
      } catch (err) {
        console.error("Failed to load more articles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [query, page]);

  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { rootMargin: "100px" }
    );

    const current = observerRef.current;
    observer.observe(current);

    return () => observer.unobserve(current);
  }, [hasMore, loading]);

  useEffect(() => {
    setPage(1);
    setResults([]);
    setHasMore(true);
  }, [query]);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "start",
          width: "100%",
        }}
      >
        <SearchBarHeader>What&apos;s making the news</SearchBarHeader>
      </div>
      
      {query ? `Results for: '${query}'` : "Results"}
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
    </>
  );
}
