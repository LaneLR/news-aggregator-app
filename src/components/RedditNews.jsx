
"use client";
import { useEffect, useState } from "react";
import NewsCard from "@/components/NewsCard";
import NewsGridWrapper from "./NewsGridWrapper";
import SearchBar from "./SearchBar";
import RedditCard from "./RedditCard";

export async function fetchRedditNews({ subs = [], limit = 10 }) {
  const params = new URLSearchParams({
    subs: subs.join(","),
    limit,
  });

  const res = await fetch(`/api/reddit-news?${params.toString()}`);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Reddit fetch failed:", res.status, errorText);
    throw new Error("Failed to fetch Reddit news");
  }

  const data = await res.json();
  return data.articles;
}

export default function RedditNews({ archiveId, selectedSubs = ["technology", "science", "worldnews"] }) {
  const [articles, setArticles] = useState([]);
  const [defaultArchiveId, setDefaultArchiveId] = useState(null);

 useEffect(() => {
  fetchRedditNews({ subs: selectedSubs }) 
    .then(setArticles)
    .catch((err) => console.error("Failed to load Reddit articles:", err));

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
  }, [selectedSubs]); // <- re-fetch if topic changes

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
        <h1>Reddit-powered News</h1>
        <SearchBar />
      </div>

<NewsGridWrapper>
  {console.log("Articles to render:", articles)}
  {articles.map((article, i) => (
    <RedditCard
      key={article.url || i} // fallback to `i` if needed
      article={article}
      archiveId={defaultArchiveId}
      viewOnly={true}
    />
  ))}
</NewsGridWrapper>

    </>
  );
}
