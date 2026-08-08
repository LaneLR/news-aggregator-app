import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { SUBSCRIBER_ONLY_CATEGORIES } from "@/lib/subscriberOnlyCategories";
import { getRelatedCoverage } from "@/lib/storyClustering";
import ArticleReader from "@/components/ArticleReader";
import JsonLd from "@/components/JsonLd";
import { estimateReadingTime } from "@/lib/readingTime";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Shared by generateMetadata and the page component so a single request
// only hits the DB once for this article, not twice.
const getArticle = cache(async (id) => {
  const { Article } = await initializeDbAndModels();
  return Article.findByPk(id);
});

function excerptFrom(article) {
  if (article.content) {
    const plainText = sanitizeHtml(article.content, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
    if (plainText.length > 0) {
      return plainText.length > 160 ? `${plainText.slice(0, 157)}...` : plainText;
    }
  }
  return `Read the full story from ${article.sourceName || "the source"} on MorningFeeds.`;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return {};

  const description = excerptFrom(article);
  const url = `${BASE_URL}/article/${article.id}`;

  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description,
      url,
      publishedTime: article.publishedAt,
      images: article.urlToImage ? [{ url: article.urlToImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: article.urlToImage ? [article.urlToImage] : undefined,
    },
  };
}

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

  const article = await getArticle(id);
  if (!article) notFound();

  const { Article, ArticleLike, ReadArticle } = await initializeDbAndModels();

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
  const readingTime = sanitizedContent ? estimateReadingTime(sanitizedContent) : null;

  const relatedCoverage = await getRelatedCoverage(Article, article);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    image: article.urlToImage ? [article.urlToImage] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: { "@type": "Organization", name: article.sourceName || "Unknown" },
    publisher: {
      "@type": "Organization",
      name: "MorningFeeds",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/images/morningfeeds-logo1.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/article/${article.id}` },
  };

  return (
    <>
      <JsonLd data={articleSchema} />
      <ArticleReader
        article={{ ...article.toJSON(), isLikedByUser }}
        sanitizedContent={sanitizedContent}
        relatedCoverage={relatedCoverage.map((a) => a.toJSON())}
        readingTime={readingTime}
      />
    </>
  );
}
