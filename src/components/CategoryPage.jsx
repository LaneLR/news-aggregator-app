"use client";

import { useState, useEffect } from "react";
import NewsCardThree from "@/components/NewsCardThree";
import NewsGridWrapper from "@/components/NewsGridWrapper";

export default function CategoryPageComponent({ category }) {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  if (!category) {
    return <p>Error: Category not specified.</p>;
  }

  // Use this for display ONLY (e.g., "Science")
  const categoryNameForDisplay =
    category.charAt(0).toUpperCase() + category.slice(1);

  useEffect(() => {
    if (!category) return;

    const fetchArticles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // *** THE FIX FOR THE 404 ERROR ***
        // Always use the original, lowercase 'category' prop for the API URL.
        const response = await fetch(`/api/articles/${category.toLowerCase()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch articles. Server responded with ${response.status}`);
        }

        const data = await response.json();
        setArticles(data.articles || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [category]);

  return (
    <>
      {/* Use the capitalized variable for the heading */}
      <h1 style={{ marginBottom: "1rem" }}>{categoryNameForDisplay} News</h1>

      {isLoading && <p>Loading articles...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {!isLoading && !error && (
        <>
          {articles.length > 0 ? (
            <NewsGridWrapper>
              {articles.map((article) => (
                <NewsCardThree
                  key={article.url}
                  article={article}
                  // Make sure archiveId is passed if needed
                  // archiveId={...} 
                  viewOnly={true}
                />
              ))}
            </NewsGridWrapper>
          ) : (
            <p>No articles found for {categoryNameForDisplay}.</p>
          )}
        </>
      )}
    </>
  );
}
