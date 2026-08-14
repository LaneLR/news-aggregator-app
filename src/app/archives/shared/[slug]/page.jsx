import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Bookmark } from "lucide-react";
import initializeDbAndModels from "@/lib/db";
import ArticleFallbackArt from "@/components/ArticleFallbackArt";
import styles from "./page.module.scss";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Shared by generateMetadata and the page component so a single request
// only hits the DB once for this archive, not twice.
const getSharedArchive = cache(async (slug) => {
  const { Archive, SavedArticle } = await initializeDbAndModels();
  return Archive.findOne({
    where: { publicSlug: slug, isPublic: true },
    include: [{ model: SavedArticle }],
  });
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const archive = await getSharedArchive(slug);
  if (!archive) return {};

  const count = archive.SavedArticles?.length || 0;
  const description = `A shared MochaReads archive with ${count} saved article${
    count === 1 ? "" : "s"
  }.`;
  const firstImage = archive.SavedArticles?.find((a) => a.urlToImage)?.urlToImage;

  return {
    title: archive.name,
    description,
    alternates: { canonical: `${BASE_URL}/archives/shared/${slug}` },
    openGraph: {
      type: "website",
      title: archive.name,
      description,
      images: firstImage ? [{ url: firstImage }] : undefined,
    },
  };
}

export default async function SharedArchivePage({ params }) {
  const { slug } = await params;

  const archive = await getSharedArchive(slug);

  if (!archive) notFound();

  const articles = (archive.SavedArticles || [])
    .map((a) => a.toJSON())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.badgeIcon}>
          <Bookmark size={18} strokeWidth={2} />
        </span>
        <div>
          <p className={styles.eyebrow}>Shared MochaReads archive</p>
          <h1 className={`${styles.title} headline`}>{archive.name}</h1>
          <p className={styles.subtitle}>
            {articles.length} article{articles.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {articles.length === 0 ? (
        <p className={styles.emptyText}>This archive doesn&apos;t have any saved articles yet.</p>
      ) : (
        <ul className={styles.articleList}>
          {articles.map((article) => (
            <li key={article.id}>
              <a
                className={styles.articleLink}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className={styles.thumbnail}>
                  {article.urlToImage ? (
                    <Image
                      src={`/api/image-proxy?url=${encodeURIComponent(article.urlToImage)}`}
                      alt=""
                      fill
                      sizes="90px"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <ArticleFallbackArt category={article.category} />
                  )}
                </div>
                <div className={styles.articleInfo}>
                  <h2 className={styles.articleTitle}>{article.title}</h2>
                  <p className={styles.articleSource}>{article.sourceName || "Unknown source"}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.footerNote}>
        Shared from{" "}
        <Link href="/" className={styles.footerLink}>
          MochaReads
        </Link>{" "}
        — a fast, customizable RSS news aggregator.
      </p>
    </div>
  );
}
