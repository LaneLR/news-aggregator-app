import initializeDbAndModels from "@/lib/db";

export async function GET(req) {
  const { sequelize } = await initializeDbAndModels();
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("query")?.trim() || "";
  const category = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const terms = query
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.replace(/'/g, "''"));

    const whereParts = [];

    for (const word of terms) {
      whereParts.push(`(
        "title" ILIKE '%${word}%' OR
        "sourceName" ILIKE '%${word}%'
      )`);
    }

    if (category) {
      whereParts.push(`"categories"::text ILIKE '%${category}%'`);
    }

    const whereClauseSQL =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const [results] = await sequelize.query(`
      SELECT *
      FROM "NewsArticles"
      ${whereClauseSQL}
      ORDER BY "publishedAt" DESC
      LIMIT ${limit} OFFSET ${offset};
    `);

    return Response.json({ results });
  } catch (err) {
    console.error("Search failed:", err);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
