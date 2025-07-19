"use client";
import { useEffect, useState } from "react";
import NewsCard from "@/components/NewsCard";
import NewsGridWrapper from "./NewsGridWrapper";
import SearchBar from "./SearchBar";

async function fetchNews() {
  let baseUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/news`, {
    cache: "force-cache",
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error("Failed to fetch news");

  const data = await res.json();
  return data.articles;
}

export default function News({ archiveId }) {
  const [articles, setArticles] = useState([]);
  const [defaultArchiveId, setDefaultArchiveId] = useState(null);

  useEffect(() => {
    fetchNews()
      .then(setArticles)
      .catch((err) => console.error("Failed to load articles:", err));

    const fetchArchive = async () => {
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

    fetchArchive();
  }, []);

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
        <h1>What&apos;s making the news</h1>
        <SearchBar />
      </div>

      <NewsGridWrapper>
        {articles.map((article) => (
          <NewsCard
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
