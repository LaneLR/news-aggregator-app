import initializeDbAndModels from "@/lib/db";
import { QueryTypes } from "sequelize";
import { auth } from "@/lib/auth";
import { FREE_TIER_SQL, EXCLUDE_GATED_CATEGORIES_SQL } from "@/lib/subscriberOnlyCategories";

// Deliberately separate from /api/search: this fires on nearly every
// keystroke, so it skips the muted-keyword/like/read joins that route does
// and only touches title (not the full article body) — fast enough to call
// live without debounced calls piling up.
export async function GET(req) {
  const { sequelize } = await initializeDbAndModels();
  const { searchParams } = new URL(req.url);
  const session = await auth();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  const query = searchParams.get("query")?.trim() || "";
  if (query.length < 2) {
    return Response.json({ suggestions: [] });
  }

  try {
    const whereParts = [`"title" ILIKE :query`];
    const replacements = { query: `%${query}%`, limit: 6 };

    if (!isSubscribed) {
      whereParts.push(FREE_TIER_SQL);
      whereParts.push(EXCLUDE_GATED_CATEGORIES_SQL);
    }

    const rows = await sequelize.query(
      `SELECT "id", "title", "sourceName", "category"
       FROM "Articles"
       WHERE ${whereParts.join(" AND ")}
       ORDER BY "publishedAt" DESC
       LIMIT :limit;`,
      { replacements, type: QueryTypes.SELECT }
    );

    return Response.json({ suggestions: rows });
  } catch (err) {
    console.error("Search suggestions failed:", err);
    return Response.json({ suggestions: [] }, { status: 500 });
  }
}
