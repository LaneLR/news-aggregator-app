import NewsCard from "./NewsCard";

//it's safer to use server components for fetching data
//as it prevents exposing API keys to the client side and exposing secrets

async function fetchNews() {
  let baseUrl;

  // Use Render's internal hostname for server-side fetches during build/runtime on Render.
  // This is the most robust way to ensure internal API calls work within Render.
  if (process.env.RENDER_INTERNAL_HOSTNAME) {
    // Construct full URL using internal hostname
    baseUrl = `http://${process.env.RENDER_INTERNAL_HOSTNAME}`;
  } else if (process.env.NEXT_PUBLIC_BASE_URL) {
    // Fallback for local development or other environments if RENDER_INTERNAL_HOSTNAME isn't set
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  } else {
    // Fallback for very basic local dev without NEXT_PUBLIC_BASE_URL
    // (though you should always define NEXT_PUBLIC_BASE_URL for local dev if hitting external APIs or your own API)
    baseUrl = "http://localhost:3000";
  }

  const url = `${baseUrl}/api/news`;

  // --- Add crucial logging to see the URL being used ---
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
