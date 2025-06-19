import NewsCard from "./NewsCard";

//it's safer to use server components for fetching data
//as it prevents exposing API keys to the client side and exposing secrets

async function fetchNews() {
  let baseUrl;

  // Render automatically provides RENDER_EXTERNAL_URL for your web service's public URL.
  // This is the most reliable way for a service to call its own API.
  if (process.env.RENDER_EXTERNAL_URL) {
    baseUrl = process.env.RENDER_EXTERNAL_URL;
  } else if (process.env.NEXT_PUBLIC_BASE_URL) {
    // Fallback for local development or if you've configured NEXT_PUBLIC_BASE_URL
    // to your public URL (e.g., in a Vercel-like setup).
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  } else {
    // Fallback for local development if no other env vars are set.
    baseUrl = 'http://localhost:3000'; // Assuming your local dev server runs on port 3000
  }

  const url = `${baseUrl}/api/news`;

  console.log(`[NewsFeed] Attempting to fetch news from: ${url}`);

  const res = await fetch(url, {
    cache: 'force-cache',
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[NewsFeed] Failed to fetch news from ${url}: Status ${res.status}, Error: ${errorText}`);
    throw new Error(`Failed to fetch news from ${url}: Status ${res.status}`);
  }
  const data = await res.json();
  console.log('[NewsFeed] Successfully fetched articles.');
  return data.articles;
}

export default async function News() {
  const articles = await fetchNews();

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "row wrap",
        justifyContent: "space-evenly",
        alignItems: "center",
      }}
    >
      {articles.map((article, i) => (
        <NewsCard key={i} article={article} />
      ))}
    </div>
  );
}
