import { notFound } from "next/navigation";
import Image from "next/image";
import { Bookmark } from "lucide-react";
import initializeDbAndModels from "@/lib/db";
import styles from "./page.module.scss";

const FALLBACK_IMAGE_URL = "/images/blurimage.png";

export default async function SharedArchivePage({ params }) {
  const { slug } = await params;

  const { Archive, SavedArticle } = await initializeDbAndModels();
  const archive = await Archive.findOne({
    where: { publicSlug: slug, isPublic: true },
    include: [{ model: SavedArticle }],
  });

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
          <p className={styles.eyebrow}>Shared MorningFeeds archive</p>
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
                  <Image
                    src={
                      article.urlToImage
                        ? `/api/image-proxy?url=${encodeURIComponent(article.urlToImage)}`
                        : FALLBACK_IMAGE_URL
                    }
                    alt=""
                    fill
                    sizes="90px"
                    style={{ objectFit: "cover" }}
                  />
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
        <a href="/" className={styles.footerLink}>
          MorningFeeds
        </a>{" "}
        — a fast, customizable RSS news aggregator.
      </p>
    </div>
  );
}
