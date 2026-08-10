import initializeDbAndModels from "@/lib/db";
import { excludeGatedCategoriesCondition } from "@/lib/subscriberOnlyCategories";
import { Op } from "sequelize";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Without this, Next statically freezes sitemap.xml at build time (it has no
// fetch() calls for Next's static-optimization heuristic to key off of) —
// meaning newly-fetched articles would never appear until the next deploy.
// Regenerating hourly keeps it fresh without a DB hit on every crawler visit.
export const revalidate = 3600;

// Market/Finance/Journal are subscriber-only — both the category pages and
// individual articles in those categories redirect anonymous/Free visitors
// to /pricing, so they're excluded here rather than pointing crawlers at a
// redirect. Matches the same exclusion already applied elsewhere (see
// src/lib/subscriberOnlyCategories.js).
const FREE_CATEGORIES = [
  "business",
  "entertainment",
  "health",
  "politics",
  "science",
  "sports",
  "tech",
  "us",
  "weather",
  "world",
];

const STATIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/pricing",
  "/about",
  "/contact-us",
  "/privacy",
  "/terms-of-service",
];

export default async function sitemap() {
  const staticEntries = [
    ...STATIC_ROUTES.map((route) => ({ url: `${BASE_URL}${route}` })),
    ...FREE_CATEGORIES.map((category) => ({ url: `${BASE_URL}/category/${category}` })),
  ];

  // No DB configured — e.g. a CI build that deliberately runs without
  // secrets (see .github/workflows/ci.yml). Serve just the static routes
  // instead of failing the build; production always has DATABASE_URL set,
  // so real deploys still get the full article/archive sitemap via the
  // hourly revalidation above.
  if (!process.env.DATABASE_URL) {
    return staticEntries;
  }

  const { Article, Archive } = await initializeDbAndModels();

  const recentArticles = await Article.findAll({
    where: {
      [Op.and]: [
        { publishedAt: { [Op.gte]: new Date(Date.now() - SEVEN_DAYS_MS) } },
        excludeGatedCategoriesCondition(),
      ],
    },
    attributes: ["id", "publishedAt", "updatedAt"],
    order: [["publishedAt", "DESC"]],
  });

  const articleEntries = recentArticles.map((article) => ({
    url: `${BASE_URL}/article/${article.id}`,
    lastModified: article.updatedAt || article.publishedAt,
  }));

  const publicArchives = await Archive.findAll({
    where: { isPublic: true },
    attributes: ["publicSlug", "updatedAt"],
  });

  const archiveEntries = publicArchives.map((archive) => ({
    url: `${BASE_URL}/archives/shared/${archive.publicSlug}`,
    lastModified: archive.updatedAt,
  }));

  return [...staticEntries, ...articleEntries, ...archiveEntries];
}
