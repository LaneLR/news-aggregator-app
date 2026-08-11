import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { getArticleReaderData } from "@/lib/articleReaderData";
import ArticleReader from "@/components/ArticleReader";
import JsonLd from "@/components/JsonLd";

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
  return `Read the full story from ${article.sourceName || "the source"} on MochaReads.`;
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

export default async function ArticlePage({ params }) {
  const { id } = await params;
  const session = await auth();

  const data = await getArticleReaderData(id, session);
  if (!data) notFound();
  if (data.gated) redirect("/pricing");

  const { article, sanitizedContent, relatedCoverage, readingTime } = data;

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
