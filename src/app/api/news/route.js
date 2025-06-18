export async function GET() {
  const apiKey = process.env.NEWS_API_KEY;

  const res = await fetch(
    `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    return new Response("Failed to fetch news data", { status: 500 });
  }
  const data = await res.json();
  console.log(data)
  return Response.json(data);
}