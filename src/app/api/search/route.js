import initializeDbAndModels from "@/lib/db";
import { QueryTypes } from "sequelize";
import { auth } from "@/lib/auth";
import { FREE_TIER_SQL, EXCLUDE_GATED_CATEGORIES_SQL } from "@/lib/subscriberOnlyCategories";

export async function GET(req) {
  const { sequelize, User, ArticleLike, ReadArticle } = await initializeDbAndModels();
  const { searchParams } = new URL(req.url);
  const session = await auth();
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

    // Matches title/source always; also matches the full article body when a
    // source's feed provided one (see Article.content — not every source
    // does). Plain ILIKE, not a Postgres full-text index — fine at current
    // scale, worth revisiting with a trigram/GIN index if search ever gets
    // noticeably slow as the (unpruned, see capacity discussion) table grows.
    terms.forEach((word, i) => {
      const key = `term${i}`;
      replacements[key] = `%${word}%`;
      whereParts.push(
        `("title" ILIKE :${key} OR "sourceName" ILIKE :${key} OR "content" ILIKE :${key})`
      );
    });

    if (category) {
      replacements.category = `%${category}%`;
      whereParts.push(`"category"::text ILIKE :category`);
    }

    // Market/Journal are fully subscriber-only, and every other category's
    // premium-tier sources are gated per-article — non-subscribers
    // (including anonymous visitors) only get free-tier/podcast results
    // outside Market/Journal here. See subscriberOnlyCategories.js.
    if (!isSubscribed) {
      whereParts.push(FREE_TIER_SQL);
      whereParts.push(EXCLUDE_GATED_CATEGORIES_SQL);
    }

    let likedUrls = new Set();
    let readUrls = new Set();
    if (session?.user?.id) {
      const currentUser = await User.findByPk(session.user.id, {
        attributes: ["mutedKeywords"],
      });
      (currentUser?.mutedKeywords || []).forEach((keyword, i) => {
        const key = `muted${i}`;
        replacements[key] = `%${keyword}%`;
        whereParts.push(`"title" NOT ILIKE :${key}`);
      });

      const [userLikes, userReads] = await Promise.all([
        ArticleLike.findAll({
          where: { userId: session.user.id },
          attributes: ["articleUrl"],
        }),
        ReadArticle.findAll({
          where: { userId: session.user.id },
          attributes: ["articleUrl"],
        }),
      ]);
      likedUrls = new Set(userLikes.map((like) => like.articleUrl));
      readUrls = new Set(userReads.map((read) => read.articleUrl));
    }

    const whereClauseSQL =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const rows = await sequelize.query(
      `SELECT *
       FROM "Articles"
       ${whereClauseSQL}
       ORDER BY "publishedAt" DESC
       LIMIT :limit OFFSET :offset;`,
      { replacements, type: QueryTypes.SELECT }
    );

    const results = rows.map((row) => ({
      ...row,
      isLikedByUser: likedUrls.has(row.url),
      isRead: readUrls.has(row.url),
    }));

    return Response.json({ results });
  } catch (err) {
    console.error("Search failed:", err);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
