import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { Op } from "sequelize";
import { GATED_TAGS, excludePremiumArticlesCondition } from "@/lib/subscriberOnlyCategories";
import { orderByDesc } from "@/lib/dbOrder";

const MAX_SOURCES = 12;

// Popular sources within the categories the user just picked in step 1 of
// onboarding — ranked by how many recent articles each source has, so the
// list is actually browsable content, not just an alphabetical dump.
export async function GET(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSubscribed = session.user.tier && session.user.tier !== "Free";

  const { searchParams } = new URL(req.url);
  const categories = (searchParams.get("categories") || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .filter((c) => isSubscribed || !GATED_TAGS.includes(c));

  if (categories.length === 0) {
    return NextResponse.json({ sources: [] });
  }

  try {
    const { Article } = await initializeDbAndModels();

    // A non-subscriber shouldn't be offered a premium-tier source to "pick"
    // here — they'd never actually see articles from it afterward (see
    // Article.tier), which would make this step actively misleading.
    const whereConditions = [{ category: { [Op.overlap]: categories } }];
    if (!isSubscribed) whereConditions.push(excludePremiumArticlesCondition());

    const rows = await Article.findAll({
      where: { [Op.and]: whereConditions },
      attributes: ["sourceName"],
      order: [orderByDesc(Article, "publishedAt")],
      limit: 500,
    });

    const counts = new Map();
    for (const row of rows) {
      if (!row.sourceName) continue;
      counts.set(row.sourceName, (counts.get(row.sourceName) || 0) + 1);
    }

    const sources = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_SOURCES)
      .map(([sourceName]) => sourceName);

    return NextResponse.json({ sources });
  } catch (err) {
    console.error("Error fetching onboarding sources:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
