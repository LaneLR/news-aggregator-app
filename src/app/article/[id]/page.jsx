import { cache } from "react";
import sanitizeHtml from "sanitize-html";
import initializeDbAndModels from "@/lib/db";
import { resolveArticleForPage } from "@/lib/resolveArticleForPage";
import ArticleReader from "@/components/ArticleReader";
import JsonLd from "@/components/JsonLd";
import { decodeHtmlEntities } from "@/lib/decodeHtmlEntities";

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
  return `Read the full story from ${decodeHtmlEntities(article.sourceName) || "the source"} on MochaReads.`;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return {};

  const description = excerptFrom(article);
  const url = `${BASE_URL}/article/${article.id}`;
  const title = decodeHtmlEntities(article.title);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: article.publishedAt,
      images: article.urlToImage ? [{ url: article.urlToImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.urlToImage ? [article.urlToImage] : undefined,
    },
  };
}

export default async function ArticlePage({ params }) {
  const { id } = await params;
  const { article, sanitizedContent, relatedCoverage, readingTime } = await resolveArticleForPage(id);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: decodeHtmlEntities(article.title),
    image: article.urlToImage ? [article.urlToImage] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: { "@type": "Organization", name: decodeHtmlEntities(article.sourceName) || "Unknown" },
    publisher: {
      "@type": "Organization",
      name: "MochaReads",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/images/MochaReads-favicon.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/article/${article.id}` },
  };

  return (
    <>
      <JsonLd data={articleSchema} />
      <ArticleReader
        article={article}
        sanitizedContent={sanitizedContent}
        relatedCoverage={relatedCoverage}
        readingTime={readingTime}
      />
    </>
  );
}
