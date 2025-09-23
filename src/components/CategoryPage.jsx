"use client";
import { useEffect, useState } from "react";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardThree from "./NewsCardThree";
import styled from "styled-components";
import Button from "./Button";
import Loading from "@/app/loading";

const SearchBarHeader = styled.div`
  font-size: 3rem;
  font-weight: 600;
  color: ${(props) => props.theme.cardBackground};
  padding: 20px 0 0 0;
  text-align: center;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 440px) {
    font-size: 1.8rem;
  }
`;

async function fetchCategoryArticles(category) {
  const baseUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/articles/${category}`, {
    next: { revalidate: 3600 },
  });

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

  const categoryNameForDisplay =
    category.charAt(0).toUpperCase() + category.slice(1);

  const loadArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCategoryArticles(category.toLowerCase());
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
        const latest = await fetchCategoryArticles(category.toLowerCase());
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
  }, [category]);

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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <SearchBarHeader>{categoryNameForDisplay} Headlines</SearchBarHeader>
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
