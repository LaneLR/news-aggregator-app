// // app/api/fetched/route.js
// import initializeDbAndModels from "@/lib/db";

// export async function GET() {
//   try {
//     const db = await initializeDbAndModels();
//     const { FetchedArticle } = db;

//     const articles = await FetchedArticle.findAll({
//       order: [["publishedAt", "DESC"]],
//       limit: 20,
//     });

//     return Response.json({ articles });
//   } catch (err) {
//     console.error("Error fetching fetched articles:", err);
//     return Response.json({ error: "Failed to fetch articles" }, { status: 500 });
//   }
// }

// /api/fetched/search.js or inside your existing fetched route
import initializeDbAndModels from "@/lib/db";

export async function GET(req) {
  const { FetchedArticle } = await initializeDbAndModels();

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category");

  const whereClause = {
    ...(category ? { category } : {}),
    ...(query
      ? {
          [Op.or]: [
            { title: { [Op.iLike]: `%${query}%` } },
            { description: { [Op.iLike]: `%${query}%` } },
          ],
        }
      : {}),
  };

  try {
    const articles = await FetchedArticle.findAll({
      where: whereClause,
      order: [["publishedAt", "DESC"]],
      limit: 50,
    });

    return Response.json({ articles });
  } catch (err) {
    console.error("Search failed:", err);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
