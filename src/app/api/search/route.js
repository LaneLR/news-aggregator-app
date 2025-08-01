// import { NextResponse } from "next/server";

// export async function GET(req) {
//   const { searchParams } = new URL(req.url);
//   const query = searchParams.get("query")?.toLowerCase() || "";

//   if (!query.trim()) {
//     return NextResponse.json({ results: [] });
//   }

//   try {
//     const page = parseInt(searchParams.get("page") || "1", 10);

//     const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
//       query
//     )}&language=en&pageSize=21&page=${page}&apiKey=${process.env.NEWS_API_KEY}`;

//     const res = await fetch(url);
//     const data = await res.json();

//     if (data.status !== "ok") {
//       console.error("NewsAPI error:", data);
//       return NextResponse.json(
//         { error: "NewsAPI failed to fetch articles" },
//         { status: 500 }
//       );
//     }

//     const results = data.articles.map((article) => ({
//       title: article.title,
//       url: article.url,
//       urlToImage: article.urlToImage,
//       description: article.description,
//       source: article.source,
//       publishedAt: article.publishedAt,
//     }));

//     return NextResponse.json({ results });
//   } catch (error) {
//     console.error("Error fetching articles from NewsAPI:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch articles" },
//       { status: 500 }
//     );
//   }
// }

import { Op } from "sequelize";
import initializeDbAndModels from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category"); // NEW
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const { FetchedArticle } = await initializeDbAndModels();

  const whereClause = {
    [Op.or]: [
      { title: { [Op.iLike]: `%${query}%` } },
      { description: { [Op.iLike]: `%${query}%` } },
    ],
  };

  if (category) {
    whereClause.categories = {
      [Op.contains]: [category], // for Postgres ARRAY type
      // or if you store comma-separated string:
      // [Op.iLike]: `%${category}%`
    };
  }

  const articles = await FetchedArticle.findAll({
    where: whereClause,
    order: [["publishedAt", "DESC"]],
    limit,
    offset,
  });

return Response.json({ results: articles });
}
