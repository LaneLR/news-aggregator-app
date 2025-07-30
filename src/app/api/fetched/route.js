// app/api/fetched/route.js
import initializeDbAndModels from "@/lib/db";

export async function GET() {
  try {
    const db = await initializeDbAndModels();
    const { FetchedArticle } = db;

    const articles = await FetchedArticle.findAll({
      order: [["publishedAt", "DESC"]],
      limit: 20,
    });

    return Response.json({ articles });
  } catch (err) {
    console.error("Error fetching fetched articles:", err);
    return Response.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
