"use client";
import { useEffect, useState } from "react";
import NewsCard from "@/components/NewsCard";
import NewsGridWrapper from "./NewsGridWrapper";
import SearchBar from "./SearchBar";
import NewsCardTwo from "./NewsCardTwo";
import NewsCardThree from "./NewsCardThree";
import styled from "styled-components";

const SearchBarHeader = styled.div`
  font-size: 3rem;
  font-weight: 600;
  color: var(--deep-blue);
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

async function fetchNews() {
  const baseUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/fetched`, {
    cache: "no-store", // always get fresh data
  });

  if (!res.ok) throw new Error("Failed to fetch news");

  const data = await res.json();
  return data.articles;
}

export default function News({ archiveId }) {
  const [articles, setArticles] = useState([]);
  const [defaultArchiveId, setDefaultArchiveId] = useState(null);
  const [latestTimestamp, setLatestTimestamp] = useState(null);
  const [newAvailable, setNewAvailable] = useState(false);

  useEffect(() => {
    loadInitialArticles();

    const handleFocus = async () => {
      try {
        const latest = await fetchNews();
        const latestArticle = latest[0];
        if (latestArticle) {
          const latestDate = new Date(latestArticle.publishedAt || latestArticle.updatedAt);
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
  }, [latestTimestamp]);

  const loadInitialArticles = async () => {
    try {
      const data = await fetchNews();
      setArticles(data);
      if (data.length > 0) {
        const newest = new Date(data[0].publishedAt || data[0].updatedAt);
        setLatestTimestamp(newest);
      }
    } catch (err) {
      console.error("Failed to load articles:", err);
    }

    // fetch default archive
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

  const refreshArticles = async () => {
    setNewAvailable(false);
    await loadInitialArticles();
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <SearchBarHeader>The most recent headlines</SearchBarHeader>

        {newAvailable && (
          <button
            onClick={refreshArticles}
            style={{
              background: "var(--primary-blue)",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              margin: "1rem 0",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            🔄 New articles available — Click to refresh
          </button>
        )}
      </div>

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


// async function fetchNews() {
//   let baseUrl =
//     process.env.RENDER_EXTERNAL_URL ||
//     process.env.NEXT_PUBLIC_BASE_URL ||
//     "http://localhost:3000";

//   const res = await fetch(`${baseUrl}/api/fetched`, {
//     cache: "force-cache",
//     next: { revalidate: 300 },
//   });

//   if (!res.ok) throw new Error("Failed to fetch news");

//   const data = await res.json();
//   return data.articles;
// }

// export default function News({ archiveId }) {
//   const [articles, setArticles] = useState([]);
//   const [defaultArchiveId, setDefaultArchiveId] = useState(null);

//   useEffect(() => {
//     fetchNews()
//       .then(setArticles)
//       .catch((err) => console.error("Failed to load articles:", err));

//     const fetchArchive = async () => {
//       try {
//         const res = await fetch("/api/archives/default");
//         const data = await res.json();
//         if (res.ok) {
//           setDefaultArchiveId(data.archiveId);
//         } else {
//           console.warn("Could not get default archive:", data.error);
//         }
//       } catch (err) {
//         console.error("Archive fetch error:", err);
//       }
//     };

//     fetchArchive();
//   }, []);

//   return (
//     <>
//       <div
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           justifyContent: "center",
//           textAlign: "start",
//           width: "100%",
//         }}
//       >
//         <SearchBarHeader>The most recent headlines</SearchBarHeader>
//       </div>

//       <NewsGridWrapper>
//         {articles.map((article) => (
//           <NewsCardThree
//             key={article.url}
//             article={article}
//             archiveId={defaultArchiveId}
//             viewOnly={true}
//           />
//         ))}
//       </NewsGridWrapper>
//     </>
//   );
// }


