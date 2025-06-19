import NewsCard from "./NewsCard";

//it's safer to use server components for fetching data
//as it prevents exposing API keys to the client side and exposing secrets

async function fetchNews() {
  const res = await fetch(`/api/news`, {
    cache: 'force-cache',
    next: { revalidate: 3600 },
  });
    if (!res.ok) {
    // Crucial: Log more details for debugging if the fetch fails
    const errorText = await res.text();
    console.error(`Failed to fetch news from /api/news: Status ${res.status}, Error: ${errorText}`);
    throw new Error(`Failed to fetch news from /api/news: Status ${res.status}`);
  }
  const data = await res.json();
  console.log(data.articles)
  return data.articles;
}

export default async function News() {
    const articles = await fetchNews()

  return (
    <div style={{
      display: 'flex',
      flexFlow: 'row wrap',
      justifyContent: 'space-evenly',
      alignItems: 'center'
    }}>
      {articles.map((article, i) => (
        <NewsCard key={i} article={article} />
      ))}
    </div>
  );
}