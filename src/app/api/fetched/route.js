import initializeDbAndModels from "@/lib/db";

export async function GET(req) {
  const { sequelize } = await initializeDbAndModels();
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category");

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
      whereParts.push(`"category"::text ILIKE '%${category}%'`);
    }

    const whereClauseSQL = whereParts.length
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    const [articles] = await sequelize.query(`
      SELECT DISTINCT ON ("sourceName") *
      FROM "FetchedArticles"
      ${whereClauseSQL}
      ORDER BY "sourceName", "publishedAt" DESC
      LIMIT 50;
    `);

    return Response.json({ articles });
  } catch (err) {
    console.error("Search failed:", err);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}