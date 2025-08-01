"use client";
import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import NewsGridWrapper from "./Pages/NewsGridWrapper";
import NewsCardThree from "./NewsCardThree";

const SearchBarHeader = styled.div`
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--dark-blue);
  padding: 15px 0 5px 0;
  text-align: center;
  width: 100%;
  display: flex;
  justify-content: left;

  @media (max-width: 440px) {
    font-size: 1.8rem;
    font-weight: 700;
  }
`;

const CategorySelect = styled.select`
  margin: 10px 0 20px 0;
  padding: 10px;
  font-size: 1rem;
  border-radius: 5px;
`;

export default function SearchFeed({ initialQuery }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(""); // New state
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
        let endpoint = `/api/search?query=${encodeURIComponent(
          query
        )}&page=${page}`;
        if (category) {
          endpoint += `&category=${encodeURIComponent(category)}`;
        }

        const res = await fetch(endpoint);
        const data = await res.json();

        if (data.results?.length === 0) {
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
  }, [query, page, category]);

  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
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
  }, [query, category]);

  return (
    <>
      <SearchBarHeader>
        {query ? `Results for: '${query}'` : "Results:"}
      </SearchBarHeader>

      <CategorySelect
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">All Categories</option>
        <option value="tech">Tech</option>
        <option value="business">Business</option>
        <option value="finance">Finance</option>
        <option value="politics">Politics</option>
        {/* Add more categories as needed */}
      </CategorySelect>

      <NewsGridWrapper>
        {results.map((article, i) => (
          <NewsCardThree key={i} article={article} />
        ))}
      </NewsGridWrapper>

      <div ref={observerRef} style={{ height: "1px" }} />
    </>
  );
}
