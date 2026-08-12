import sanitizeHtml from "sanitize-html";
import initializeDbAndModels from "@/lib/db";
import { SUBSCRIBER_ONLY_CATEGORIES } from "@/lib/subscriberOnlyCategories";
import { getRelatedCoverage } from "@/lib/storyClustering";
import { estimateReadingTime } from "@/lib/readingTime";

const SANITIZE_OPTIONS = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "a", "blockquote",
    "ul", "ol", "li", "h2", "h3", "h4", "img", "figure", "figcaption",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
  },
  allowedSchemes: ["http", "https"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
  },
};

// Many RSS feeds re-embed the lead/hero image as the very first element of
// the body content — redundant with (and visually disconnected from, thanks
// to the actions-row divider sitting between them) the dedicated hero image
// ArticleReader already renders above the content. Stripping a leading
// image/figure lets the title/hero/content read as one continuous block.
function stripLeadingImage(html) {
  return html
    .replace(/^\s*<figure[^>]*>[\s\S]*?<\/figure>\s*/i, "")
    .replace(/^\s*<img[^>]*>\s*/i, "");
}

// Shared by the full article page (src/app/article/[id]/page.js) and the
// 3-pane reading-pane API (src/app/api/articles/[id]/reader/route.js) so
// the sanitize/gating/related-coverage/reading-time logic lives in one
// place instead of drifting between a server-rendered and client-fetched
// copy of the same article view.
export async function getArticleReaderData(id, session) {
  const { Article, ArticleLike, ReadArticle } = await initializeDbAndModels();
  const article = await Article.findByPk(id);
  if (!article) return null;

  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  // Fully-gated category (Market/Journal), or a premium-tier source outside
  // those two (every other category's long tail — see Article.tier).
  // Podcasts are always free regardless of tier. This is the backstop that
  // keeps a Free/anonymous viewer from reading a premium article directly
  // by URL even though the category feed itself never showed it to them.
  const isGated =
    (article.category || []).some((c) => SUBSCRIBER_ONLY_CATEGORIES.has(String(c).toLowerCase())) ||
    (article.tier === "premium" && article.sourceType !== "podcast");
  if (isGated && !isSubscribed) {
    return { gated: true };
  }

  let isLikedByUser = false;
  if (session?.user?.id) {
    const [like] = await Promise.all([
      ArticleLike.findOne({
        where: { userId: session.user.id, articleUrl: article.url },
      }),
      ReadArticle.findOrCreate({
        where: { userId: session.user.id, articleUrl: article.url },
      }),
    ]);
    isLikedByUser = !!like;
  }

  let sanitizedContent = article.content
    ? sanitizeHtml(article.content, SANITIZE_OPTIONS)
    : null;
  if (sanitizedContent && article.urlToImage) {
    sanitizedContent = stripLeadingImage(sanitizedContent);
  }
  const readingTime = sanitizedContent ? estimateReadingTime(sanitizedContent) : null;
  const relatedCoverage = await getRelatedCoverage(Article, article);

  return {
    gated: false,
    article: { ...article.toJSON(), isLikedByUser },
    sanitizedContent,
    relatedCoverage: relatedCoverage.map((a) => a.toJSON()),
    readingTime,
  };
}
