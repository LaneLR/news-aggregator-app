import { notFound, redirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { SUBSCRIBER_ONLY_CATEGORIES } from "@/lib/subscriberOnlyCategories";
import { getRelatedCoverage } from "@/lib/storyClustering";
import ArticleReader from "@/components/ArticleReader";

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

export default async function ArticlePage({ params }) {
  const { id } = await params;
  const session = await auth();

  const { Article, ArticleLike, ReadArticle } = await initializeDbAndModels();
  const article = await Article.findByPk(id);
  if (!article) notFound();

  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  const isGated = (article.category || []).some((c) =>
    SUBSCRIBER_ONLY_CATEGORIES.has(String(c).toLowerCase())
  );
  if (isGated && !isSubscribed) {
    redirect("/pricing");
  }

  let isLikedByUser = false;
  if (session?.user?.id) {
    const [like] = await Promise.all([
      ArticleLike.findOne({
        where: { userId: session.user.id, articleUrl: article.url },
      }),
      // Opening the reader is itself a "read" signal, same as clicking out
      // to the source — no need to wait for the click-tracking round trip.
      ReadArticle.findOrCreate({
        where: { userId: session.user.id, articleUrl: article.url },
      }),
    ]);
    isLikedByUser = !!like;
  }

  const sanitizedContent = article.content
    ? sanitizeHtml(article.content, SANITIZE_OPTIONS)
    : null;

  const relatedCoverage = await getRelatedCoverage(Article, article);

  return (
    <ArticleReader
      article={{ ...article.toJSON(), isLikedByUser }}
      sanitizedContent={sanitizedContent}
      relatedCoverage={relatedCoverage.map((a) => a.toJSON())}
    />
  );
}
