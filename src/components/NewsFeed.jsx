import NewsCard from "@/components/NewsCard";
import NewsGridWrapper from "./NewsGridWrapper";

async function fetchNews() {
  let baseUrl;

  if (process.env.RENDER_EXTERNAL_URL) {
    baseUrl = process.env.RENDER_EXTERNAL_URL;
  } else if (process.env.NEXT_PUBLIC_BASE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  } else {
    baseUrl = "http://localhost:3000";
  }

  const url = `${baseUrl}/api/news`;

  console.log(`[NewsFeed] Attempting to fetch news from: ${url}`);

  const res = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(
      `[NewsFeed] Failed to fetch news from ${url}: Status ${res.status}, Error: ${errorText}`
    );
    throw new Error(`Failed to fetch news from ${url}: Status ${res.status}`);
  }
  const data = await res.json();
  console.log("[NewsFeed] Successfully fetched articles.");
  return data.articles;
}

export default async function News() {
  const articles = await fetchNews();

  return (
    <NewsGridWrapper>
      {articles.map((article, i) => (
        <NewsCard key={i} article={article} />
      ))}
    </NewsGridWrapper>
  );
}
