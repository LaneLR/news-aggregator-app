import initializeDbAndModels from "@/lib/db";
import { QueryTypes } from "sequelize";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req) {
  const { sequelize } = await initializeDbAndModels();
  const { searchParams } = new URL(req.url);
  const session = await getServerSession(authOptions);
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  const query = searchParams.get("query")?.trim() || "";
  const category = searchParams.get("category");
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const terms = query.split(/\s+/).filter(Boolean);

    const whereParts = [];
    const replacements = { limit, offset };

    terms.forEach((word, i) => {
      const key = `term${i}`;
      replacements[key] = `%${word}%`;
      whereParts.push(`("title" ILIKE :${key} OR "sourceName" ILIKE :${key})`);
    });

    if (category) {
      replacements.category = `%${category}%`;
      whereParts.push(`"category"::text ILIKE :category`);
    }

    // Market/Finance/Journal content is subscriber-only — non-subscribers
    // (including anonymous visitors) only get "news" results here.
    if (!isSubscribed) {
      whereParts.push(`"sourceType" = 'news'`);
    }

    const whereClauseSQL =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const results = await sequelize.query(
      `SELECT *
       FROM "Articles"
       ${whereClauseSQL}
       ORDER BY "publishedAt" DESC
       LIMIT :limit OFFSET :offset;`,
      { replacements, type: QueryTypes.SELECT }
    );

    return Response.json({ results });
  } catch (err) {
    console.error("Search failed:", err);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
