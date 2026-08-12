import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { Op } from "sequelize";
import {
  excludeGatedCategoriesCondition,
  excludePremiumArticlesCondition,
  GATED_TAGS,
} from "@/lib/subscriberOnlyCategories";
import { buildKeywordExclusion } from "@/lib/keywordFilter";
import { DEFAULT_HOME_SECTIONS, CATEGORY_SECTION_TAGS } from "@/lib/homeSections";

export async function GET(req) {
  const session = await auth();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  try {
    const { Article, ArticleLike, ReadArticle, User } = await initializeDbAndModels();

    let homeSections = DEFAULT_HOME_SECTIONS;
    let mutedKeywords = [];
    if (session?.user?.id) {
      const currentUser = await User.findByPk(session.user.id, {
        attributes: ["mutedKeywords", "homeSections"],
      });
      mutedKeywords = currentUser?.mutedKeywords || [];
      // homeSections defaults to [] at the DB level only if it were ever
      // explicitly cleared by hand — treat that the same as "never set".
      if (currentUser?.homeSections?.length) homeSections = currentUser.homeSections;
    }

    const showForYou = homeSections.includes("forYou");
    const showTopStories = homeSections.includes("topStories");
    // Defense in depth against a stale/tampered preference — a free user's
    // saved list should never contain a gated tag (the PATCH route already
    // strips these), but don't rely solely on that.
    const categoriesToDisplay = homeSections.filter(
      (key) =>
        CATEGORY_SECTION_TAGS.includes(key) && (isSubscribed || !GATED_TAGS.includes(key))
    );

    // Market/Journal content is subscriber-only, and every other category's
    // premium-tier sources are gated per-article — exclude both from the
    // general home feed for everyone else, otherwise gated content would
    // leak into a requested category (e.g. an article tagged both
    // "Business" and "Market") regardless of subscription status.
    const visibilityConditions = isSubscribed
      ? []
      : [excludeGatedCategoriesCondition(), excludePremiumArticlesCondition()];

    const keywordExclusion = buildKeywordExclusion(mutedKeywords);
    if (keywordExclusion) visibilityConditions.push(keywordExclusion);

    // Fetch latest articles for each of the user's selected categories
    const categoryResults = await Promise.all(
      categoriesToDisplay.map(async (category) => ({
        category,
        articles: await Article.findAll({
          where: {
            [Op.and]: [
              ...visibilityConditions,
              { category: { [Op.contains]: [category] } },
            ],
          },
          limit: 10,
          order: [["publishedAt", "DESC"]],
        }),
      }))
    );

    // Combine everything into a structured object — every requested category
    // gets a key even when empty (`[]`), not just the ones with current
    // articles. NewNewsPage renders one section per key it receives;
    // dropping empty categories here would make their whole section (title
    // included, not just the article row) disappear the moment real data
    // replaces the loading skeleton, instead of just showing "nothing new"
    // inside a section that's still there.
    const categorizedArticles = {};
    categoryResults.forEach((result) => {
      categorizedArticles[result.category] = result.articles;
    });

    // Add user-specific "liked"/"read" status to all articles
    if (session?.user?.id) {
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
      const likedUrls = new Set(userLikes.map((like) => like.articleUrl));
      const readUrls = new Set(userReads.map((read) => read.articleUrl));

      for (const category in categorizedArticles) {
        categorizedArticles[category] = categorizedArticles[category].map(
          (article) => ({
            ...article.toJSON(),
            isLikedByUser: likedUrls.has(article.url),
            isRead: readUrls.has(article.url),
          })
        );
      }
    }

    return NextResponse.json({
      categories: categorizedArticles,
      showForYou,
      showTopStories,
    });
  } catch (err) {
    console.error("Error fetching categorized news:", err);
    return NextResponse.json(
      { error: "Could not fetch news" },
      { status: 500 }
    );
  }
}
