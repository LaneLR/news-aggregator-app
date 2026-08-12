import initializeDbAndModels from "@/lib/db";
import { QueryTypes } from "sequelize";
import { FREE_TIER_SQL, EXCLUDE_GATED_CATEGORIES_SQL } from "@/lib/subscriberOnlyCategories";

export async function GET(req) {
  const { sequelize } = await initializeDbAndModels();
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category");

  try {
    const terms = query.split(/\s+/).filter(Boolean);

    const whereParts = [];
    const replacements = {};

    terms.forEach((word, i) => {
      const key = `term${i}`;
      replacements[key] = `%${word}%`;
      whereParts.push(`("title" ILIKE :${key} OR "sourceName" ILIKE :${key})`);
    });

    if (category) {
      replacements.category = `%${category}%`;
      whereParts.push(`"category"::text ILIKE :category`);
    }

    // This endpoint has no auth check at all, so it must always apply the
    // same restriction an anonymous visitor gets everywhere else: free-tier
    // (or podcast) sources only, and nothing from the fully-gated
    // Market/Journal categories. See subscriberOnlyCategories.js.
    whereParts.push(FREE_TIER_SQL);
    whereParts.push(EXCLUDE_GATED_CATEGORIES_SQL);

    const whereClauseSQL = `WHERE ${whereParts.join(" AND ")}`;

    const articles = await sequelize.query(
      `SELECT DISTINCT ON ("sourceName") *
       FROM "Articles"
       ${whereClauseSQL}
       ORDER BY "sourceName", "publishedAt" DESC
       LIMIT 50;`,
      { replacements, type: QueryTypes.SELECT }
    );

    return Response.json({ articles });
  } catch (err) {
    console.error("Search failed:", err);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}